import {
  CONTENT_SOURCE,
  DAPP_CHANNEL,
  RUNTIME_EVENT_TYPE,
  RUNTIME_REQUEST_TYPE,
  RUNTIME_REQUEST_STATUS_TYPE,
  type DappProviderErrorCode,
  type DappEventMessage,
  type DappRpcFailure,
  type DappRpcResponse,
  type DappRuntimePendingAck,
  isDappRpcRequest,
} from '@/lib/dapp/protocol'
const INPAGE_SCRIPT_PATH = 'assets/inpage-provider.js'
const INPAGE_SESSION_DATA_ATTR = 'qubicSession'

const createSessionToken = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const inpageSession = createSessionToken()

const injectProviderScript = () => {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome
  const runtime = chromeApi?.runtime
  if (!runtime?.getURL) return

  const script = document.createElement('script')
  script.src = runtime.getURL(INPAGE_SCRIPT_PATH)
  script.async = false
  script.dataset.source = 'qubic-inpage-provider'
  script.dataset[INPAGE_SESSION_DATA_ATTR] = inpageSession
  const parent = document.head || document.documentElement
  parent.appendChild(script)
  script.remove()
}

const postToPage = (message: DappRpcResponse | DappEventMessage) => {
  window.postMessage({ ...message, session: inpageSession }, '*')
}

const sendFailure = (
  id: string,
  message: string,
  code: DappProviderErrorCode = 'INTERNAL_ERROR',
) => {
  const payload: DappRpcFailure = {
    channel: DAPP_CHANNEL,
    source: CONTENT_SOURCE,
    id,
    ok: false,
    error: { code, message },
  }
  postToPage(payload)
}

const isRuntimePendingAck = (value: unknown): value is DappRuntimePendingAck => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return record.pending === true && typeof record.id === 'string' && Boolean(record.id)
}

const pollRuntimeResult = (
  id: string,
  session: string,
  runtime: NonNullable<typeof chrome.runtime>,
  chromeApi: typeof chrome,
  startedAt = Date.now(),
) => {
  if (Date.now() - startedAt > 2 * 60 * 1000) {
    sendFailure(id, 'Provider request timed out')
    return
  }

  runtime.sendMessage(
    { type: RUNTIME_REQUEST_STATUS_TYPE, payload: { id, session } },
    (response: unknown) => {
      const maybeError = chromeApi.runtime?.lastError
      if (maybeError) {
        window.setTimeout(() => pollRuntimeResult(id, session, runtime, chromeApi, startedAt), 500)
        return
      }
      if (isRuntimePendingAck(response)) {
        window.setTimeout(() => pollRuntimeResult(id, session, runtime, chromeApi, startedAt), 500)
        return
      }
      if (
        !response ||
        typeof response !== 'object' ||
        (response as DappRpcResponse).channel !== DAPP_CHANNEL ||
        (response as DappRpcResponse).source !== CONTENT_SOURCE
      ) {
        sendFailure(id, 'Invalid response from extension runtime')
        return
      }
      postToPage(response as DappRpcResponse)
    },
  )
}

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return
  const data = event.data as unknown
  if (!isDappRpcRequest(data)) return
  if (data.session !== inpageSession) return

  const chromeApi = (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome
  const runtime = chromeApi?.runtime
  if (!runtime?.sendMessage) {
    sendFailure(data.id, 'Extension runtime is not available')
    return
  }

  runtime.sendMessage(
    { type: RUNTIME_REQUEST_TYPE, payload: data },
    (response: DappRpcResponse | DappRuntimePendingAck) => {
      const maybeError = chromeApi?.runtime?.lastError
      if (maybeError) {
        sendFailure(data.id, maybeError.message || 'Failed to reach extension runtime')
        return
      }
      if (isRuntimePendingAck(response)) {
        pollRuntimeResult(data.id, inpageSession, runtime, chromeApi)
        return
      }
      if (!response || response.channel !== DAPP_CHANNEL || response.source !== CONTENT_SOURCE) {
        sendFailure(data.id, 'Invalid response from extension runtime')
        return
      }
      postToPage(response)
    },
  )
})

const chromeApi = (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome
chromeApi?.runtime?.onMessage?.addListener((message: unknown) => {
  if (!message || typeof message !== 'object') return
  const record = message as Record<string, unknown>
  if (record.type !== RUNTIME_EVENT_TYPE) return
  const payload = record.payload
  if (!payload || typeof payload !== 'object') return
  const event = payload as DappEventMessage
  if (event.channel !== DAPP_CHANNEL || event.source !== CONTENT_SOURCE) return
  postToPage(event)
})

injectProviderScript()
