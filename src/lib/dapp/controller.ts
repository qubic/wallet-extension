import { createSdk } from '@qubic-labs/sdk'
import { buildApprovalParamsPreview } from '@/lib/dapp/approval-preview'
import { isSidepanelPresenceFresh } from '@/lib/dapp/sidepanel-presence'
import { DappProviderError, asProviderError } from '@/lib/dapp/errors'
import { getOriginFromUrl, normalizeOrigin } from '@/lib/dapp/origin'
import type {
  DappApprovalDecision,
  DappRpcRequest,
  DappRpcResponse,
  DappRuntimePendingAck,
  DappRuntimeRequestStatusPayload,
} from '@/lib/dapp/protocol'
import { asDappFailure, asDappSuccess, asRuntimePendingAck } from '@/lib/dapp/responses'
import {
  type DappCurrentAccount,
  type DappExecutionRequest,
  type DappPermissionsState,
  getDappCurrentAccount,
  getDappPendingRequests,
  getDappPermissions,
  removeDappPermission,
  setDappPermissions,
} from '@/lib/dapp/storage'
import {
  appendPendingApprovalRequest,
  completeExecutionRequest,
  consumeRequestResultById,
  getExecutionRequestById,
  getRequestResultById,
  markExecutionRequestExecuting,
  persistExecutionRequest,
  pruneExpiredDappArtifacts,
  removePendingApprovalRequest,
  storeRequestResult,
} from '@/lib/dapp/request-store'
import {
  DAPP_PENDING_REQUESTS_MAX_PER_ORIGIN,
  DAPP_PENDING_REQUESTS_MAX_TOTAL,
  DAPP_SEND_TRANSACTION_TARGET_TICK_OFFSET_DEFAULT,
  DAPP_SEND_TRANSACTION_TARGET_TICK_OFFSET_MAX,
  DAPP_SEND_TRANSACTION_TARGET_TICK_OFFSET_MIN,
} from '@/lib/dapp/timing'
import { validateDappMethodParams } from '@/lib/dapp/validators'
import {
  sendTransactionFromSeed,
  parseSignTransactionParams,
  signMessageFromSeed,
  signTransactionFromSeed,
} from '@/lib/dapp/signing'
import { QUBIC_RPC_BASE_URL } from '@/lib/config/constants'
import { upsertPendingTransactionInChromeStorage } from '@/lib/pending-transactions-storage'
import { openBrowserVault, verifyVaultAccess } from '@/lib/vault'

const sdk = createSdk({ baseUrl: QUBIC_RPC_BASE_URL })
const DAPP_APPROVAL_WINDOW_WIDTH = 380
const DAPP_APPROVAL_WINDOW_HEIGHT = 600
const processingApprovalDecisionIds = new Set<string>()

type DappSendTransactionParams = {
  toIdentity?: unknown
  amount?: unknown
  targetTick?: unknown
  targetTickOffset?: unknown
  inputType?: unknown
  inputBytes?: unknown
}

const ensureConnected = (origin: string, permissions: DappPermissionsState) => {
  if (!permissions[origin]) {
    throw new DappProviderError('NOT_CONNECTED', 'Origin is not connected to wallet')
  }
}

const hasOpenSidePanel = async () => {
  if (await isSidepanelPresenceFresh()) return true

  const runtimeWithContexts = chrome.runtime as typeof chrome.runtime & {
    getContexts?: (
      filter?: unknown,
    ) => Promise<Array<{ contextType?: string; documentUrl?: string }>>
  }

  if (!runtimeWithContexts.getContexts) return false

  try {
    const sidePanelUrl = chrome.runtime.getURL('sidepanel.html')
    const contexts = await runtimeWithContexts.getContexts({ contextTypes: ['SIDE_PANEL'] })

    return contexts.some(
      (context) =>
        context.contextType === 'SIDE_PANEL' &&
        typeof context.documentUrl === 'string' &&
        context.documentUrl.startsWith(sidePanelUrl),
    )
  } catch {
    return false
  }
}

const ensureApprovalWindow = async () => {
  if (await hasOpenSidePanel()) return

  const popupUrl = chrome.runtime.getURL('popup.html?dapp=1')
  try {
    await chrome.windows.create({
      url: popupUrl,
      type: 'popup',
      focused: true,
      width: DAPP_APPROVAL_WINDOW_WIDTH,
      height: DAPP_APPROVAL_WINDOW_HEIGHT,
    })
  } catch {
    // Ignore window creation failures, the request stays pending.
  }
}

const ensurePendingApprovalCapacity = async (origin: string) => {
  const pendingRequests = await getDappPendingRequests()
  if (pendingRequests.length >= DAPP_PENDING_REQUESTS_MAX_TOTAL) {
    throw new DappProviderError('INVALID_REQUEST', 'Too many pending wallet requests')
  }

  const originPendingCount = pendingRequests.filter((request) => request.origin === origin).length
  if (originPendingCount >= DAPP_PENDING_REQUESTS_MAX_PER_ORIGIN) {
    throw new DappProviderError('INVALID_REQUEST', 'Too many pending requests for this origin')
  }
}

const enqueueApprovalRequest = async (request: DappExecutionRequest) => {
  await ensurePendingApprovalCapacity(request.origin)
  await persistExecutionRequest(request)
  await appendPendingApprovalRequest({
    id: request.id,
    method: request.method,
    origin: request.origin,
    createdAt: request.createdAt,
    params: buildApprovalParamsPreview(request.method, request.params, {
      account: request.account,
    }),
  })
  await ensureApprovalWindow()
}

const connectOrigin = async (origin: string, requestId: string, session: string) => {
  const permissions = await getDappPermissions()
  if (!permissions[origin]) {
    const account = await getDappCurrentAccount()
    await enqueueApprovalRequest({
      id: requestId,
      method: 'connect',
      origin,
      createdAt: Date.now(),
      session,
      state: 'awaitingApproval',
      account: account ?? undefined,
    })
    return asRuntimePendingAck(requestId)
  }

  permissions[origin] = { origin, connectedAt: Date.now() }
  await setDappPermissions(permissions)
  return { connected: true as const, origin }
}

const disconnectOrigin = async (origin: string) => {
  await removeDappPermission(origin)
  return { disconnected: true as const }
}

const getAccountForOrigin = async (origin: string) => {
  const permissions = await getDappPermissions()
  ensureConnected(origin, permissions)
  return getDappCurrentAccount()
}

const requireCurrentAccount = async (): Promise<DappCurrentAccount> => {
  const account = await getDappCurrentAccount()
  if (!account) throw new DappProviderError('NO_ACCOUNT', 'No active account is selected')
  return account
}

const getSeedForSigning = async (passphrase: string, identity: string): Promise<string> => {
  const vault = await openBrowserVault(passphrase, false)
  const access = await verifyVaultAccess(vault)
  if (!access.valid) throw new DappProviderError('INVALID_PASSPHRASE', 'Invalid passphrase')
  try {
    return await vault.getSeed(identity)
  } catch {
    throw new DappProviderError('WATCH_ONLY_ACCOUNT', 'Active account cannot sign')
  }
}

const queueSigningApproval = async (
  origin: string,
  request: DappRpcRequest,
): Promise<DappRuntimePendingAck> => {
  const permissions = await getDappPermissions()
  ensureConnected(origin, permissions)

  const account = await requireCurrentAccount()
  await enqueueApprovalRequest({
    id: request.id,
    method: request.method === 'signMessage' ? 'signMessage' : 'signTransaction',
    origin,
    createdAt: Date.now(),
    session: request.session ?? '',
    state: 'awaitingApproval',
    params: request.params,
    account,
  })
  return asRuntimePendingAck(request.id)
}

const toOptionalInteger = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'bigint'
        ? Number(value)
        : typeof value === 'string'
          ? Number.parseInt(value.trim(), 10)
          : Number.NaN
  if (!Number.isFinite(numeric)) return undefined
  return Math.trunc(numeric)
}

const normalizeQueuedSendTransactionParams = (params: unknown) => {
  const input = (params && typeof params === 'object' ? params : {}) as DappSendTransactionParams
  const explicitTargetTick = toOptionalInteger(input.targetTick)
  const rawOffset = toOptionalInteger(input.targetTickOffset)

  if (explicitTargetTick !== undefined && explicitTargetTick < 1) {
    throw new DappProviderError('INVALID_PARAMS', 'Invalid targetTick')
  }
  if (rawOffset !== undefined) {
    if (
      rawOffset < DAPP_SEND_TRANSACTION_TARGET_TICK_OFFSET_MIN ||
      rawOffset > DAPP_SEND_TRANSACTION_TARGET_TICK_OFFSET_MAX
    ) {
      throw new DappProviderError(
        'INVALID_PARAMS',
        `targetTickOffset must be between ${DAPP_SEND_TRANSACTION_TARGET_TICK_OFFSET_MIN} and ${DAPP_SEND_TRANSACTION_TARGET_TICK_OFFSET_MAX}`,
      )
    }
  }

  if (explicitTargetTick !== undefined) {
    const { targetTickOffset: _ignoredOffset, ...rest } = input as Record<string, unknown>
    return {
      ...rest,
      targetTick: explicitTargetTick,
    }
  }

  return {
    ...(input as Record<string, unknown>),
    targetTickOffset: rawOffset ?? DAPP_SEND_TRANSACTION_TARGET_TICK_OFFSET_DEFAULT,
  }
}

const resolveSendTransactionParams = async (params: unknown) => {
  const normalized = normalizeQueuedSendTransactionParams(params)
  const input = normalized as Record<string, unknown>
  const explicitTargetTick = toOptionalInteger(input.targetTick)
  if (explicitTargetTick !== undefined) {
    return normalized
  }

  const offset =
    toOptionalInteger(input.targetTickOffset) ?? DAPP_SEND_TRANSACTION_TARGET_TICK_OFFSET_DEFAULT
  let targetTick: number | undefined

  try {
    targetTick = Number(await sdk.tick.getSuggestedTargetTick({ offset }))
  } catch {
    try {
      targetTick = Number((await sdk.rpc.live.tickInfo()).tick) + offset
    } catch {
      targetTick = undefined
    }
  }

  if (!targetTick || !Number.isFinite(targetTick) || targetTick < 1) {
    throw new DappProviderError('INTERNAL_ERROR', 'Unable to resolve target tick')
  }

  return {
    ...input,
    targetTick,
    targetTickOffset: offset,
  }
}

const queueSendTransactionApproval = async (
  origin: string,
  request: DappRpcRequest,
): Promise<DappRuntimePendingAck> => {
  const permissions = await getDappPermissions()
  ensureConnected(origin, permissions)
  const account = await requireCurrentAccount()
  const queuedParams = normalizeQueuedSendTransactionParams(request.params)

  await enqueueApprovalRequest({
    id: request.id,
    method: 'sendTransaction',
    origin,
    createdAt: Date.now(),
    session: request.session ?? '',
    state: 'awaitingApproval',
    params: queuedParams,
    account,
  })
  return asRuntimePendingAck(request.id)
}

const executeApprovedRequest = async (
  request: DappExecutionRequest,
  decision: DappApprovalDecision,
): Promise<DappRpcResponse> => {
  const normalizedOrigin = normalizeOrigin(request.origin)

  switch (request.method) {
    case 'connect': {
      if (!decision.approved) {
        return asDappFailure(request.id, 'USER_REJECTED', 'Connection request was rejected')
      }
      const permissions = await getDappPermissions()
      permissions[normalizedOrigin] = {
        origin: normalizedOrigin,
        connectedAt: Date.now(),
      }
      await setDappPermissions(permissions)
      return asDappSuccess(request.id, { connected: true as const, origin: normalizedOrigin })
    }
    case 'signMessage':
    case 'signTransaction':
    case 'sendTransaction': {
      if (!decision.approved) {
        return asDappFailure(request.id, 'USER_REJECTED', 'Request was rejected by user')
      }
      const passphrase = decision.passphrase?.trim()
      if (!passphrase) {
        return asDappFailure(request.id, 'INVALID_PASSPHRASE', 'Passphrase is required')
      }
      const permissions = await getDappPermissions()
      ensureConnected(normalizedOrigin, permissions)
      const account = request.account
      if (!account?.identity) {
        throw new DappProviderError('NO_ACCOUNT', 'No active account is selected')
      }
      if (request.encryptedParams && request.params === undefined) {
        return asDappFailure(
          request.id,
          'INTERNAL_ERROR',
          'Request payload is no longer available in this browser session',
        )
      }
      const seed = await getSeedForSigning(passphrase, account.identity)
      if (request.method === 'sendTransaction') {
        const resolvedSendParams = await resolveSendTransactionParams(request.params)
        const result = await sendTransactionFromSeed(seed, resolvedSendParams, sdk.transactions)
        try {
          const parsed = parseSignTransactionParams(resolvedSendParams)
          const rawParams =
            resolvedSendParams && typeof resolvedSendParams === 'object'
              ? (resolvedSendParams as Record<string, unknown>)
              : null
          const tokenKey =
            typeof rawParams?.tokenKey === 'string'
              ? rawParams.tokenKey
              : parsed.inputType === 0 || parsed.inputType === undefined
                ? 'qu'
                : undefined

          await upsertPendingTransactionInChromeStorage({
            hash: result.txId,
            sourceIdentity: account.identity,
            destinationIdentity: parsed.toIdentity,
            amount: parsed.amount,
            inputType: parsed.inputType ?? 0,
            tokenKey,
            targetTick: Number(result.targetTick),
            createdAt: Date.now(),
            status: 'pending',
          })
        } catch {
          // Pending tracking is best-effort and must not fail a successfully broadcast dApp tx.
        }
        return asDappSuccess(request.id, result)
      }

      const result =
        request.method === 'signMessage'
          ? await signMessageFromSeed(seed, request.params)
          : await signTransactionFromSeed(seed, request.params, sdk.transactions)
      return asDappSuccess(request.id, result)
    }
    default:
      return asDappFailure(
        request.id,
        'METHOD_NOT_SUPPORTED',
        `Unsupported method: ${request.method}`,
      )
  }
}

export const handleDappApprovalDecision = async (decision: DappApprovalDecision) => {
  if (processingApprovalDecisionIds.has(decision.id)) {
    return true
  }
  processingApprovalDecisionIds.add(decision.id)

  try {
    const existingResult = await getRequestResultById(decision.id)
    if (existingResult) {
      // Idempotent ack for duplicate/late approval submissions after a result was already produced.
      return true
    }

    const request = await getExecutionRequestById(decision.id)
    if (!request) {
      await removePendingApprovalRequest(decision.id)
      return false
    }
    if (request.state !== 'awaitingApproval') {
      return true
    }

    const claimedRequest = await markExecutionRequestExecuting(decision.id)
    if (!claimedRequest) {
      return true
    }

    try {
      const response = await executeApprovedRequest(claimedRequest, decision)
      await storeRequestResult(claimedRequest, response)
      await completeExecutionRequest(claimedRequest.id)
      return true
    } catch (error) {
      const normalized = asProviderError(error, {
        code: 'INTERNAL_ERROR',
        message: 'Unhandled provider error',
      })
      await storeRequestResult(
        claimedRequest,
        asDappFailure(claimedRequest.id, normalized.code, normalized.message),
      )
      await completeExecutionRequest(claimedRequest.id)
      return true
    }
  } finally {
    processingApprovalDecisionIds.delete(decision.id)
  }
}

export const handleDappRpcRequest = async (
  request: DappRpcRequest,
  sender: chrome.runtime.MessageSender,
) => {
  const origin = sender.url ? getOriginFromUrl(sender.url) : null
  if (!origin) throw new DappProviderError('UNSUPPORTED_ORIGIN', 'Unsupported sender origin')
  const normalizedOrigin = normalizeOrigin(origin)
  const requestSession = typeof request.session === 'string' ? request.session.trim() : ''

  validateDappMethodParams(request.method, request.params)

  switch (request.method) {
    case 'connect':
      if (!requestSession) throw new DappProviderError('INVALID_REQUEST', 'Missing request session')
      return connectOrigin(normalizedOrigin, request.id, requestSession)
    case 'disconnect':
      return disconnectOrigin(normalizedOrigin)
    case 'getAccount':
      return getAccountForOrigin(normalizedOrigin)
    case 'signMessage':
    case 'signTransaction':
      if (!requestSession) throw new DappProviderError('INVALID_REQUEST', 'Missing request session')
      return queueSigningApproval(normalizedOrigin, request)
    case 'sendTransaction':
      if (!requestSession) throw new DappProviderError('INVALID_REQUEST', 'Missing request session')
      return queueSendTransactionApproval(normalizedOrigin, request)
    default:
      throw new DappProviderError('METHOD_NOT_SUPPORTED', `Unsupported method: ${request.method}`)
  }
}

export const handleDappRequestStatus = async (
  payload: DappRuntimeRequestStatusPayload,
  sender: chrome.runtime.MessageSender,
): Promise<DappRpcResponse | DappRuntimePendingAck> => {
  await pruneExpiredDappArtifacts()

  const senderOrigin = sender.url ? getOriginFromUrl(sender.url) : null
  if (!senderOrigin) {
    return asDappFailure(payload.id, 'UNSUPPORTED_ORIGIN', 'Unsupported sender origin')
  }
  const normalizedSenderOrigin = normalizeOrigin(senderOrigin)

  const result = await getRequestResultById(payload.id)
  if (result) {
    if (result.origin !== normalizedSenderOrigin || result.session !== payload.session) {
      return asDappFailure(payload.id, 'NOT_CONNECTED', 'Request does not belong to this origin')
    }
    await consumeRequestResultById(payload.id)
    return result.response
  }

  const execution = await getExecutionRequestById(payload.id)
  if (execution) {
    if (execution.origin !== normalizedSenderOrigin || execution.session !== payload.session) {
      return asDappFailure(payload.id, 'NOT_CONNECTED', 'Request does not belong to this origin')
    }
    return asRuntimePendingAck(payload.id)
  }

  return asDappFailure(payload.id, 'INTERNAL_ERROR', 'Request state was lost')
}

export const startupDappController = async () => {
  await pruneExpiredDappArtifacts()
}
