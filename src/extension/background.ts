import { createSdk } from '@qubic-labs/sdk'
import { DappProviderError, asProviderError } from '@/lib/dapp/errors'
import { getOriginFromUrl, normalizeOrigin } from '@/lib/dapp/origin'
import {
  CONTENT_SOURCE,
  DAPP_CHANNEL,
  RUNTIME_APPROVAL_DECISION_TYPE,
  RUNTIME_EVENT_TYPE,
  RUNTIME_REQUEST_TYPE,
  type DappApprovalDecision,
  type DappEventMessage,
  type DappProviderErrorCode,
  type DappRpcRequest,
  type DappRpcResponse,
  isDappRpcRequest,
} from '@/lib/dapp/protocol'
import {
  DAPP_CURRENT_ACCOUNT_KEY,
  DAPP_PERMISSIONS_KEY,
  type DappCurrentAccount,
  type DappPendingRequest,
  type DappPermissionsState,
  getDappCurrentAccount,
  getDappPendingRequests,
  getDappPermissions,
  removeDappPermission,
  setDappPendingRequests,
  setDappPermissions,
} from '@/lib/dapp/storage'
import { validateDappMethodParams } from '@/lib/dapp/validators'
import { signMessageFromSeed, signTransactionFromSeed } from '@/lib/dapp/signing'
import { openBrowserVault, verifyVaultAccess } from '@/lib/vault'

const APPROVAL_TIMEOUT_MS = 2 * 60 * 1000
const sdk = createSdk()

const approvalWaiters = new Map<
  string,
  {
    resolve: (decision: DappApprovalDecision) => void | Promise<void>
    timeoutId: number
  }
>()

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

const addPendingRequest = async (request: DappPendingRequest) => {
  const requests = await getDappPendingRequests()
  await setDappPendingRequests([...requests, request])
}

const removePendingRequest = async (id: string) => {
  const requests = await getDappPendingRequests()
  await setDappPendingRequests(requests.filter((request) => request.id !== id))
}

const requestApproval = async (request: DappPendingRequest): Promise<DappApprovalDecision> => {
  await addPendingRequest(request)
  await ensureApprovalWindow()

  return new Promise<DappApprovalDecision>((resolve) => {
    const timeoutId = self.setTimeout(async () => {
      approvalWaiters.delete(request.id)
      await removePendingRequest(request.id)
      resolve({
        id: request.id,
        approved: false,
      })
    }, APPROVAL_TIMEOUT_MS)

    approvalWaiters.set(request.id, {
      resolve: async (decision) => {
        self.clearTimeout(timeoutId)
        await removePendingRequest(request.id)
        resolve(decision)
      },
      timeoutId,
    })
  })
}

const connectOrigin = async (origin: string, requestId: string) => {
  const permissions = await getDappPermissions()
  if (!permissions[origin]) {
    const decision = await requestApproval({
      id: requestId,
      method: 'connect',
      origin,
      createdAt: Date.now(),
    })
    if (!decision.approved) {
      throw new DappProviderError('USER_REJECTED', 'Connection request was rejected')
    }
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

const approveSigning = async (
  origin: string,
  request: DappRpcRequest,
): Promise<{ passphrase: string; account: DappCurrentAccount }> => {
  const permissions = await getDappPermissions()
  ensureConnected(origin, permissions)

  const account = await requireCurrentAccount()
  const decision = await requestApproval({
    id: request.id,
    method: request.method === 'signMessage' ? 'signMessage' : 'signTransaction',
    origin,
    createdAt: Date.now(),
    params: request.params,
  })
  if (!decision.approved) {
    throw new DappProviderError('USER_REJECTED', 'Request was rejected by user')
  }
  const passphrase = decision.passphrase?.trim()
  if (!passphrase) {
    throw new DappProviderError('INVALID_PASSPHRASE', 'Passphrase is required')
  }
  return { passphrase, account }
}

const settleApprovalDecision = (decision: DappApprovalDecision) => {
  const waiter = approvalWaiters.get(decision.id)
  if (!waiter) return false
  approvalWaiters.delete(decision.id)
  void waiter.resolve(decision)
  return true
}

const handleRequest = async (request: DappRpcRequest, sender: chrome.runtime.MessageSender) => {
  const origin = sender.url ? getOriginFromUrl(sender.url) : null
  if (!origin) {
    throw new DappProviderError('UNSUPPORTED_ORIGIN', 'Unsupported sender origin')
  }
  const normalizedOrigin = normalizeOrigin(origin)

  validateDappMethodParams(request.method, request.params)

  switch (request.method) {
    case 'connect':
      return connectOrigin(normalizedOrigin, request.id)
    case 'disconnect':
      return disconnectOrigin(normalizedOrigin)
    case 'getAccount':
      return getAccountForOrigin(normalizedOrigin)
    case 'signMessage': {
      const { passphrase, account } = await approveSigning(normalizedOrigin, request)
      const seed = await getSeedForSigning(passphrase, account.identity)
      return signMessageFromSeed(seed, request.params)
    }
    case 'signTransaction': {
      const { passphrase, account } = await approveSigning(normalizedOrigin, request)
      const seed = await getSeedForSigning(passphrase, account.identity)
      return signTransactionFromSeed(seed, request.params, sdk.transactions)
    }
    default:
      throw new DappProviderError('METHOD_NOT_SUPPORTED', `Unsupported method: ${request.method}`)
  }
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
    sendResponse({ ok: Boolean(isValid && settleApprovalDecision(payload)) })
    return undefined
  }

  if (record.type !== RUNTIME_REQUEST_TYPE) return undefined
  const payload = record.payload
  if (!isDappRpcRequest(payload)) {
    sendResponse(asFailure('unknown', 'INVALID_REQUEST', 'Invalid provider request payload'))
    return undefined
  }

  void handleRequest(payload, sender)
    .then((result) => sendResponse(asResponse(payload.id, result)))
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

void setDappPendingRequests([])
