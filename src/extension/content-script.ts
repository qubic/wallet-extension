const DAPP_CHANNEL = 'qubic:dapp'
const CONTENT_SOURCE = 'qubic:content'
const RUNTIME_REQUEST_TYPE = 'qubic:dapp:request'
const RUNTIME_REQUEST_STATUS_TYPE = 'qubic:dapp:request-status'
const RUNTIME_EVENT_TYPE = 'qubic:dapp:event'

const DAPP_APPROVAL_TIMEOUT_MS = 2 * 60 * 1000
const DAPP_STATUS_POLL_INTERVAL_MS = 500

const INPAGE_SCRIPT_PATH = 'assets/inpage-provider.js'
const INPAGE_SESSION_DATA_ATTR = 'qubicSession'

type DappProviderErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_PARAMS'
  | 'UNSUPPORTED_ORIGIN'
  | 'NOT_CONNECTED'
  | 'METHOD_NOT_SUPPORTED'
  | 'USER_REJECTED'
  | 'INVALID_PASSPHRASE'
  | 'WATCH_ONLY_ACCOUNT'
  | 'NO_ACCOUNT'
  | 'NOT_IMPLEMENTED'
  | 'INTERNAL_ERROR'

type DappRpcRequest = {
  channel: typeof DAPP_CHANNEL
  source: 'qubic:inpage'
  id: string
  method: string
  params?: unknown
  session?: string
}

type DappRpcResponse = {
  channel: typeof DAPP_CHANNEL
  source: typeof CONTENT_SOURCE
  id: string
  ok: boolean
  result?: unknown
  error?: { code: DappProviderErrorCode; message: string }
}

type DappEventMessage = {
  channel: typeof DAPP_CHANNEL
  source: typeof CONTENT_SOURCE
  event: 'accountChanged' | 'disconnect'
  payload?: unknown
}

type DappRuntimePendingAck = { pending: true; id: string }

const getChromeApi = () =>
  (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome ?? null

const getChromeRuntime = () => getChromeApi()?.runtime ?? null

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isDappRpcRequest = (value: unknown): value is DappRpcRequest => {
  if (!isObject(value)) return false
  return (
    value.channel === DAPP_CHANNEL &&
    value.source === 'qubic:inpage' &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.method === 'string' &&
    value.method.length > 0
  )
}

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

const isDappRuntimeEventEnvelope = (
  value: unknown,
): value is { type: typeof RUNTIME_EVENT_TYPE; payload: DappEventMessage } => {
  if (!isObject(value) || value.type !== RUNTIME_EVENT_TYPE || !isObject(value.payload))
    return false
  const payload = value.payload
  return (
    payload.channel === DAPP_CHANNEL &&
    payload.source === CONTENT_SOURCE &&
    (payload.event === 'accountChanged' || payload.event === 'disconnect')
  )
}

const isRuntimePendingAck = (value: unknown): value is DappRuntimePendingAck => {
  if (!isObject(value)) return false
  return value.pending === true && typeof value.id === 'string' && value.id.length > 0
}

const createSessionToken = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const inpageSession = createSessionToken()

const injectProviderScript = () => {
  const runtime = getChromeRuntime()
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
  postToPage({
    channel: DAPP_CHANNEL,
    source: CONTENT_SOURCE,
    id,
    ok: false,
    error: { code, message },
  })
}

const pollRuntimeResult = (
  id: string,
  session: string,
  runtime: NonNullable<typeof chrome.runtime>,
  chromeApi: typeof chrome,
  startedAt = Date.now(),
) => {
  if (Date.now() - startedAt > DAPP_APPROVAL_TIMEOUT_MS) {
    sendFailure(id, 'Provider request timed out')
    return
  }

  runtime.sendMessage(
    { type: RUNTIME_REQUEST_STATUS_TYPE, payload: { id, session } },
    (response: unknown) => {
      const maybeError = chromeApi.runtime?.lastError
      if (maybeError) {
        window.setTimeout(
          () => pollRuntimeResult(id, session, runtime, chromeApi, startedAt),
          DAPP_STATUS_POLL_INTERVAL_MS,
        )
        return
      }
      if (isRuntimePendingAck(response)) {
        window.setTimeout(
          () => pollRuntimeResult(id, session, runtime, chromeApi, startedAt),
          DAPP_STATUS_POLL_INTERVAL_MS,
        )
        return
      }
      if (!isDappRpcResponse(response) || response.source !== CONTENT_SOURCE) {
        sendFailure(id, 'Invalid response from extension runtime')
        return
      }
      postToPage(response)
    },
  )
}

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return
  const data = event.data as unknown
  if (!isDappRpcRequest(data)) return
  if (data.session !== inpageSession) return

  const chromeApi = getChromeApi()
  const runtime = getChromeRuntime()
  if (!runtime?.sendMessage) {
    sendFailure(data.id, 'Extension runtime is not available')
    return
  }

  runtime.sendMessage({ type: RUNTIME_REQUEST_TYPE, payload: data }, (response: unknown) => {
    const maybeError = chromeApi?.runtime?.lastError
    if (maybeError) {
      sendFailure(data.id, maybeError.message || 'Failed to reach extension runtime')
      return
    }
    if (isRuntimePendingAck(response)) {
      pollRuntimeResult(data.id, inpageSession, runtime, chromeApi)
      return
    }
    if (!isDappRpcResponse(response) || response.source !== CONTENT_SOURCE) {
      sendFailure(data.id, 'Invalid response from extension runtime')
      return
    }
    postToPage(response)
  })
})

getChromeApi()?.runtime?.onMessage?.addListener((message: unknown) => {
  if (!isDappRuntimeEventEnvelope(message)) return
  postToPage(message.payload)
})

injectProviderScript()
