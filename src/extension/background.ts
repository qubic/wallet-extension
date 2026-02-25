import { createSdk } from '@qubic-labs/sdk'
import { DappProviderError, asProviderError } from '@/lib/dapp/errors'
import { getOriginFromUrl, normalizeOrigin } from '@/lib/dapp/origin'
import {
  CONTENT_SOURCE,
  DAPP_CHANNEL,
  RUNTIME_APPROVAL_DECISION_TYPE,
  RUNTIME_EVENT_TYPE,
  RUNTIME_REQUEST_TYPE,
  RUNTIME_REQUEST_STATUS_TYPE,
  type DappApprovalDecision,
  type DappEventMessage,
  type DappProviderErrorCode,
  type DappRpcRequest,
  type DappRpcResponse,
  type DappRuntimePendingAck,
  type DappRuntimeRequestStatusPayload,
  isDappRpcRequest,
} from '@/lib/dapp/protocol'
import {
  DAPP_CURRENT_ACCOUNT_KEY,
  DAPP_PERMISSIONS_KEY,
  type DappCurrentAccount,
  type DappExecutionRequest,
  type DappPendingRequest,
  type DappPermissionsState,
  getDappCurrentAccount,
  getDappPermissions,
  removeDappPermission,
  setDappPermissions,
} from '@/lib/dapp/storage'
import {
  appendPendingApprovalRequest,
  completeExecutionRequest,
  discardRequestResult,
  getExecutionRequestById,
  getRequestResultById,
  persistExecutionRequest,
  pruneExpiredDappArtifacts,
  removePendingApprovalRequest,
  storeRequestResult,
} from '@/lib/dapp/request-store'
import { validateDappMethodParams } from '@/lib/dapp/validators'
import { signMessageFromSeed, signTransactionFromSeed } from '@/lib/dapp/signing'
import { openBrowserVault, verifyVaultAccess } from '@/lib/vault'
const sdk = createSdk()

const asResponse = (id: string, result: unknown): DappRpcResponse => ({
  channel: DAPP_CHANNEL,
  source: CONTENT_SOURCE,
  id,
  ok: true,
  result,
})

const asFailure = (id: string, code: DappProviderErrorCode, message: string): DappRpcResponse => ({
  channel: DAPP_CHANNEL,
  source: CONTENT_SOURCE,
  id,
  ok: false,
  error: { code, message },
})

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

const truncatePreviewValue = (value: string, max = 280) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value

const buildApprovalParamsPreview = (
  method: DappPendingRequest['method'],
  params: unknown,
): unknown => {
  if (!params || typeof params !== 'object') {
    if (method === 'signMessage' && typeof params === 'string') {
      return truncatePreviewValue(params)
    }
    return undefined
  }

  const record = params as Record<string, unknown>
  if (method === 'signMessage') {
    if (typeof record.message === 'string') {
      return { message: truncatePreviewValue(record.message) }
    }
    if (typeof record.hex === 'string') {
      return { hex: truncatePreviewValue(record.hex) }
    }
    if (typeof record.base64 === 'string') {
      return { base64: truncatePreviewValue(record.base64) }
    }
    return undefined
  }

  if (method === 'signTransaction') {
    const preview: Record<string, unknown> = {}
    if (typeof record.toIdentity === 'string') preview.toIdentity = record.toIdentity
    if (typeof record.amount === 'string' || typeof record.amount === 'number') {
      preview.amount = record.amount
    }
    if (typeof record.inputType === 'string' || typeof record.inputType === 'number') {
      preview.inputType = record.inputType
    }
    if (typeof record.targetTick === 'string' || typeof record.targetTick === 'number') {
      preview.targetTick = record.targetTick
    }
    return Object.keys(preview).length > 0 ? preview : undefined
  }

  return undefined
}

const asPendingAck = (id: string): DappRuntimePendingAck => ({
  pending: true,
  id,
})

const enqueueApprovalRequest = async (request: DappExecutionRequest) => {
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
    })
    return asPendingAck(requestId)
  }

  permissions[origin] = {
    origin,
    connectedAt: Date.now(),
  }
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
  if (!account) {
    throw new DappProviderError('NO_ACCOUNT', 'No active account is selected')
  }
  return account
}

const getSeedForSigning = async (passphrase: string, identity: string): Promise<string> => {
  const vault = await openBrowserVault(passphrase, false)
  const access = await verifyVaultAccess(vault)
  if (!access.valid) {
    throw new DappProviderError('INVALID_PASSPHRASE', 'Invalid passphrase')
  }
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
    params: request.params,
    account,
  })
  return asPendingAck(request.id)
}

const executeApprovedRequest = async (
  request: DappExecutionRequest,
  decision: DappApprovalDecision,
) => {
  const normalizedOrigin = normalizeOrigin(request.origin)

  switch (request.method) {
    case 'connect': {
      if (!decision.approved) {
        return asFailure(request.id, 'USER_REJECTED', 'Connection request was rejected')
      }
      const permissions = await getDappPermissions()
      permissions[normalizedOrigin] = {
        origin: normalizedOrigin,
        connectedAt: Date.now(),
      }
      await setDappPermissions(permissions)
      return asResponse(request.id, { connected: true as const, origin: normalizedOrigin })
    }
    case 'signMessage':
    case 'signTransaction': {
      if (!decision.approved) {
        return asFailure(request.id, 'USER_REJECTED', 'Request was rejected by user')
      }
      const passphrase = decision.passphrase?.trim()
      if (!passphrase) {
        return asFailure(request.id, 'INVALID_PASSPHRASE', 'Passphrase is required')
      }
      const permissions = await getDappPermissions()
      ensureConnected(normalizedOrigin, permissions)
      const account = request.account
      if (!account?.identity) {
        throw new DappProviderError('NO_ACCOUNT', 'No active account is selected')
      }
      const seed = await getSeedForSigning(passphrase, account.identity)
      const result =
        request.method === 'signMessage'
          ? await signMessageFromSeed(seed, request.params)
          : await signTransactionFromSeed(seed, request.params, sdk.transactions)
      return asResponse(request.id, result)
    }
    default:
      return asFailure(request.id, 'METHOD_NOT_SUPPORTED', `Unsupported method: ${request.method}`)
  }
}

const settleApprovalDecision = async (decision: DappApprovalDecision) => {
  const request = await getExecutionRequestById(decision.id)
  if (!request) {
    await removePendingApprovalRequest(decision.id)
    return false
  }

  try {
    const response = await executeApprovedRequest(request, decision)
    await storeRequestResult(request, response)
    await completeExecutionRequest(request.id)
    return true
  } catch (error) {
    const normalized = asProviderError(error, {
      code: 'INTERNAL_ERROR',
      message: 'Unhandled provider error',
    })
    await storeRequestResult(request, asFailure(request.id, normalized.code, normalized.message))
    await completeExecutionRequest(request.id)
    return true
  }
}

const handleRequest = async (request: DappRpcRequest, sender: chrome.runtime.MessageSender) => {
  const origin = sender.url ? getOriginFromUrl(sender.url) : null
  if (!origin) {
    throw new DappProviderError('UNSUPPORTED_ORIGIN', 'Unsupported sender origin')
  }
  const normalizedOrigin = normalizeOrigin(origin)
  const requestSession = typeof request.session === 'string' ? request.session.trim() : ''

  validateDappMethodParams(request.method, request.params)

  switch (request.method) {
    case 'connect':
      if (!requestSession) {
        throw new DappProviderError('INVALID_REQUEST', 'Missing request session')
      }
      return connectOrigin(normalizedOrigin, request.id, requestSession)
    case 'disconnect':
      return disconnectOrigin(normalizedOrigin)
    case 'getAccount':
      return getAccountForOrigin(normalizedOrigin)
    case 'signMessage':
      if (!requestSession) {
        throw new DappProviderError('INVALID_REQUEST', 'Missing request session')
      }
      return queueSigningApproval(normalizedOrigin, request)
    case 'signTransaction':
      if (!requestSession) {
        throw new DappProviderError('INVALID_REQUEST', 'Missing request session')
      }
      return queueSigningApproval(normalizedOrigin, request)
    default:
      throw new DappProviderError('METHOD_NOT_SUPPORTED', `Unsupported method: ${request.method}`)
  }
}

const isRuntimePendingAck = (value: unknown): value is DappRuntimePendingAck => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return record.pending === true && typeof record.id === 'string' && Boolean(record.id)
}

const getRequestStatus = async (
  payload: DappRuntimeRequestStatusPayload,
  sender: chrome.runtime.MessageSender,
): Promise<DappRpcResponse | DappRuntimePendingAck> => {
  await pruneExpiredDappArtifacts()
  const senderOrigin = sender.url ? getOriginFromUrl(sender.url) : null
  if (!senderOrigin) {
    return asFailure(payload.id, 'UNSUPPORTED_ORIGIN', 'Unsupported sender origin')
  }
  const normalizedSenderOrigin = normalizeOrigin(senderOrigin)

  const result = await getRequestResultById(payload.id)
  if (result) {
    if (result.origin !== normalizedSenderOrigin || result.session !== payload.session) {
      return asFailure(payload.id, 'NOT_CONNECTED', 'Request does not belong to this origin')
    }
    await discardRequestResult(payload.id)
    return result.response
  }

  const execution = await getExecutionRequestById(payload.id)
  if (execution) {
    if (execution.origin !== normalizedSenderOrigin || execution.session !== payload.session) {
      return asFailure(payload.id, 'NOT_CONNECTED', 'Request does not belong to this origin')
    }
    return asPendingAck(payload.id)
  }

  return asFailure(payload.id, 'INTERNAL_ERROR', 'Request state was lost')
}

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return undefined
  const record = message as Record<string, unknown>

  if (record.type === RUNTIME_APPROVAL_DECISION_TYPE) {
    const payload = record.payload as DappApprovalDecision | undefined
    const isValid =
      payload &&
      typeof payload.id === 'string' &&
      payload.id.length > 0 &&
      typeof payload.approved === 'boolean'
    if (!isValid) {
      sendResponse({ ok: false })
      return undefined
    }
    void settleApprovalDecision(payload)
      .then((ok) => sendResponse({ ok }))
      .catch(() => sendResponse({ ok: false }))
    return true
  }

  if (record.type === RUNTIME_REQUEST_STATUS_TYPE) {
    const payload = record.payload as DappRuntimeRequestStatusPayload | undefined
    if (
      !payload ||
      typeof payload.id !== 'string' ||
      !payload.id ||
      typeof payload.session !== 'string' ||
      !payload.session
    ) {
      sendResponse({ ok: false, pending: false, error: 'Invalid status payload' })
      return undefined
    }
    void getRequestStatus(payload, sender)
      .then((response) => sendResponse(response))
      .catch(() => sendResponse(asFailure(payload.id, 'INTERNAL_ERROR', 'Status check failed')))
    return true
  }

  if (record.type !== RUNTIME_REQUEST_TYPE) return undefined
  const payload = record.payload
  if (!isDappRpcRequest(payload)) {
    sendResponse(asFailure('unknown', 'INVALID_REQUEST', 'Invalid provider request payload'))
    return undefined
  }

  void handleRequest(payload, sender)
    .then((result) => {
      if (isRuntimePendingAck(result)) {
        sendResponse(result)
        return
      }
      sendResponse(asResponse(payload.id, result))
    })
    .catch((error) => {
      const normalized = asProviderError(error, {
        code: 'INTERNAL_ERROR',
        message: 'Unhandled provider error',
      })
      sendResponse(asFailure(payload.id, normalized.code, normalized.message))
    })

  return true
})

const broadcastEvent = async (event: DappEventMessage) => {
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (!tab.id) continue
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: RUNTIME_EVENT_TYPE,
        payload: event,
      })
    } catch {
      // Ignore tabs without content script.
    }
  }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return
  if (changes[DAPP_CURRENT_ACCOUNT_KEY]) {
    const payload = changes[DAPP_CURRENT_ACCOUNT_KEY].newValue
    void broadcastEvent({
      channel: DAPP_CHANNEL,
      source: CONTENT_SOURCE,
      event: 'accountChanged',
      payload,
    })
  }
  if (changes[DAPP_PERMISSIONS_KEY]) {
    const oldValue = (changes[DAPP_PERMISSIONS_KEY].oldValue ?? {}) as Record<string, unknown>
    const newValue = (changes[DAPP_PERMISSIONS_KEY].newValue ?? {}) as Record<string, unknown>
    const removedOrigins = Object.keys(oldValue).filter((origin) => !(origin in newValue))
    for (const origin of removedOrigins) {
      void broadcastEvent({
        channel: DAPP_CHANNEL,
        source: CONTENT_SOURCE,
        event: 'disconnect',
        payload: { origin },
      })
    }
  }
})

void pruneExpiredDappArtifacts()
