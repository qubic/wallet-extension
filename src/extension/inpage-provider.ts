import {
  CONTENT_SOURCE,
  DAPP_CHANNEL,
  INPAGE_SOURCE,
  type DappConnectResult,
  type DappDisconnectResult,
  type DappEvent,
  type DappEventMessage,
  type DappMethod,
  type DappMethodResultMap,
  type DappProviderAccount,
  type DappRpcRequest,
  type DappSignMessageResult,
  type DappSignTransactionResult,
  isDappEventMessage,
  isDappRpcResponse,
} from '@/lib/dapp/protocol'

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
  signMessage: (message: unknown) => Promise<DappSignMessageResult>
  disconnect: () => Promise<DappDisconnectResult>
  on: (event: DappEvent, callback: ProviderEventCallback) => () => void
  off: (event: DappEvent, callback: ProviderEventCallback) => void
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
    }, 15_000)

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
    const listeners = eventListeners.get(event)
    listeners?.delete(callback)
  },
}

const handleWindowMessage = (event: MessageEvent) => {
  if (event.source !== window) return
  const data = event.data as unknown
  if (!data || typeof data !== 'object') return

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
    const providerError = Object.assign(new Error(data.error.message), {
      code: data.error.code,
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
