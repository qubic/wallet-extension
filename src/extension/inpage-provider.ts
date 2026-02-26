const DAPP_CHANNEL = 'qubic:dapp'
const INPAGE_SOURCE = 'qubic:inpage'
const CONTENT_SOURCE = 'qubic:content'

const DAPP_PROVIDER_REQUEST_TIMEOUT_DEFAULT_MS = 15_000
const DAPP_PROVIDER_REQUEST_TIMEOUT_APPROVAL_MS = 150_000

type DappEvent = 'accountChanged' | 'disconnect'
type DappMethod =
  | 'connect'
  | 'getAccount'
  | 'signTransaction'
  | 'sendTransaction'
  | 'signMessage'
  | 'disconnect'

type DappProviderAccount = { identity: string; name?: string }
type DappConnectResult = { connected: true; origin: string }
type DappDisconnectResult = { disconnected: true }
type DappSignMessageResult = { signatureHex: string; digestHex: string }
type DappSignTransactionResult = {
  txId: string
  targetTick: number
  txBytesBase64: string
  txBytesHex: string
}
type DappSendTransactionResult = DappSignTransactionResult & {
  networkTxId: string
  broadcast: unknown
}

type DappMethodResultMap = {
  connect: DappConnectResult
  getAccount: DappProviderAccount | null
  signTransaction: DappSignTransactionResult
  sendTransaction: DappSendTransactionResult
  signMessage: DappSignMessageResult
  disconnect: DappDisconnectResult
}

type DappRpcRequest = {
  channel: typeof DAPP_CHANNEL
  source: typeof INPAGE_SOURCE
  id: string
  method: DappMethod
  params?: unknown
  session?: string
}

type DappRpcResponse = {
  channel: typeof DAPP_CHANNEL
  source: typeof CONTENT_SOURCE
  id: string
  ok: boolean
  result?: unknown
  error?: { code: string; message: string }
  session?: string
}

type DappEventMessage = {
  channel: typeof DAPP_CHANNEL
  source: typeof CONTENT_SOURCE
  event: DappEvent
  payload?: unknown
  session?: string
}

type ProviderEventCallback = (payload: unknown) => void

type QubicProvider = {
  isQubic: true
  version: string
  request: <TMethod extends DappMethod>(
    method: TMethod,
    params?: unknown,
  ) => Promise<DappMethodResultMap[TMethod]>
  connect: () => Promise<DappConnectResult>
  getAccount: () => Promise<DappProviderAccount | null>
  signTransaction: (tx: unknown) => Promise<DappSignTransactionResult>
  sendTransaction: (tx: unknown) => Promise<DappSendTransactionResult>
  signMessage: (message: unknown) => Promise<DappSignMessageResult>
  disconnect: () => Promise<DappDisconnectResult>
  on: (event: DappEvent, callback: ProviderEventCallback) => () => void
  off: (event: DappEvent, callback: ProviderEventCallback) => void
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isDappRpcResponse = (value: unknown): value is DappRpcResponse => {
  if (!isObject(value)) return false
  return (
    value.channel === DAPP_CHANNEL &&
    value.source === CONTENT_SOURCE &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.ok === 'boolean'
  )
}

const isDappEventMessage = (value: unknown): value is DappEventMessage => {
  if (!isObject(value)) return false
  return (
    value.channel === DAPP_CHANNEL &&
    value.source === CONTENT_SOURCE &&
    (value.event === 'accountChanged' || value.event === 'disconnect')
  )
}

const eventListeners = new Map<DappEvent, Set<ProviderEventCallback>>()
const pending = new Map<
  string,
  {
    resolve: (value: unknown) => void
    reject: (reason?: unknown) => void
    timeoutId: number
  }
>()
const currentScript = document.currentScript as HTMLScriptElement | null
const providerSession = currentScript?.dataset?.qubicSession ?? ''
const createRequestId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const getRequestTimeoutMs = (method: DappMethod) =>
  method === 'connect' || method === 'signMessage' || method === 'signTransaction'
    ? DAPP_PROVIDER_REQUEST_TIMEOUT_APPROVAL_MS
    : DAPP_PROVIDER_REQUEST_TIMEOUT_DEFAULT_MS

const emitEvent = (message: DappEventMessage) => {
  const listeners = eventListeners.get(message.event)
  if (!listeners) return
  for (const callback of listeners) callback(message.payload)
}

const request = <TMethod extends DappMethod>(method: TMethod, params?: unknown) =>
  new Promise<DappMethodResultMap[TMethod]>((resolve, reject) => {
    if (!providerSession) {
      reject(new Error('Provider session is not initialized'))
      return
    }
    const id = createRequestId()
    const timeoutId = window.setTimeout(() => {
      pending.delete(id)
      reject(new Error('Provider request timed out'))
    }, getRequestTimeoutMs(method))

    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timeoutId,
    })

    const payload: DappRpcRequest = {
      channel: DAPP_CHANNEL,
      source: INPAGE_SOURCE,
      id,
      method,
      params,
      session: providerSession,
    }
    window.postMessage(payload, '*')
  })

const provider: QubicProvider = {
  isQubic: true,
  version: '1.0.0',
  request,
  connect: async () => request('connect'),
  getAccount: async () => request('getAccount'),
  signTransaction: async (tx) => request('signTransaction', tx),
  sendTransaction: async (tx) => request('sendTransaction', tx),
  signMessage: async (message) => request('signMessage', message),
  disconnect: async () => request('disconnect'),
  on: (event, callback) => {
    const listeners = eventListeners.get(event) ?? new Set<ProviderEventCallback>()
    listeners.add(callback)
    eventListeners.set(event, listeners)
    return () => {
      listeners.delete(callback)
    }
  },
  off: (event, callback) => {
    eventListeners.get(event)?.delete(callback)
  },
}

const handleWindowMessage = (event: MessageEvent) => {
  if (event.source !== window) return
  const data = event.data as unknown
  if (!isObject(data)) return

  if (isDappRpcResponse(data) && data.source === CONTENT_SOURCE) {
    if (data.session !== providerSession) return
    const entry = pending.get(data.id)
    if (!entry) return
    pending.delete(data.id)
    window.clearTimeout(entry.timeoutId)
    if (data.ok) {
      entry.resolve(data.result)
      return
    }
    const providerError = Object.assign(new Error(data.error?.message ?? 'Provider error'), {
      code: data.error?.code,
    })
    entry.reject(providerError)
    return
  }

  if (isDappEventMessage(data) && data.source === CONTENT_SOURCE) {
    if (data.session !== providerSession) return
    emitEvent(data)
  }
}

const target = window as typeof window & { qubic?: QubicProvider }
if (!target.qubic) {
  window.addEventListener('message', handleWindowMessage)
  const frozenProvider = Object.freeze(provider)
  try {
    Object.defineProperty(target, 'qubic', {
      value: frozenProvider,
      writable: false,
      configurable: false,
      enumerable: true,
    })
  } catch {
    target.qubic = frozenProvider
  }
}
