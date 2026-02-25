import { createSdk } from '@qubic-labs/sdk'
import { buildApprovalParamsPreview } from '@/lib/dapp/approval-preview'
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
} from '@/lib/dapp/timing'
import { validateDappMethodParams } from '@/lib/dapp/validators'
import { signMessageFromSeed, signTransactionFromSeed } from '@/lib/dapp/signing'
import { openBrowserVault, verifyVaultAccess } from '@/lib/vault'

const sdk = createSdk()

const ensureConnected = (origin: string, permissions: DappPermissionsState) => {
  if (!permissions[origin]) {
    throw new DappProviderError('NOT_CONNECTED', 'Origin is not connected to wallet')
  }
}

const ensureApprovalWindow = async () => {
  const popupUrl = chrome.runtime.getURL('popup.html?dapp=1')
  try {
    await chrome.windows.create({
      url: popupUrl,
      type: 'popup',
      focused: true,
      width: 380,
      height: 680,
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
    params: buildApprovalParamsPreview(request.method, request.params),
  })
  await ensureApprovalWindow()
}

const connectOrigin = async (origin: string, requestId: string, session: string) => {
  const permissions = await getDappPermissions()
  if (!permissions[origin]) {
    await enqueueApprovalRequest({
      id: requestId,
      method: 'connect',
      origin,
      createdAt: Date.now(),
      session,
      state: 'awaitingApproval',
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
    case 'signTransaction': {
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
