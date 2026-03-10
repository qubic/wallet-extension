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

type DappRpcRequest = Readonly<{
  channel: string
  source: string
  id: string
  method: string
  params?: unknown
  session?: string
}>

type DappRpcResponse =
  | Readonly<{
      channel: string
      source: string
      id: string
      ok: true
      result: unknown
      session?: string
    }>
  | Readonly<{
      channel: string
      source: string
      id: string
      ok: false
      error: {
        code: DappProviderErrorCode
        message: string
      }
      session?: string
    }>

type DappEventMessage = Readonly<{
  channel: string
  source: string
  event: string
  payload?: unknown
  session?: string
}>

type DappRuntimeEventEnvelope = Readonly<{
  type: string
  payload: DappEventMessage
}>

type DappRuntimePendingAck = Readonly<{
  pending: true
  id: string
}>

const DAPP_CHANNEL = 'qubic:dapp'
const INPAGE_SOURCE = 'qubic:inpage'
const CONTENT_SOURCE = 'qubic:content'
const RUNTIME_REQUEST_TYPE = 'qubic:dapp:request'
const RUNTIME_EVENT_TYPE = 'qubic:dapp:event'
const RUNTIME_REQUEST_STATUS_TYPE = 'qubic:dapp:request-status'
const DAPP_APPROVAL_TIMEOUT_MS = 2 * 60 * 1000
const DAPP_STATUS_POLL_INTERVAL_MS = 500

const INPAGE_SCRIPT_PATH = 'assets/inpage-provider.js'
const INPAGE_SESSION_DATA_ATTR = 'qubicSession'
const INPAGE_SESSION_DOM_ATTR = 'data-qubic-inpage-session'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isDappRpcRequest = (value: unknown): value is DappRpcRequest => {
  if (!isObject(value)) return false
  return (
    value.channel === DAPP_CHANNEL &&
    value.source === INPAGE_SOURCE &&
    typeof value.id === 'string' &&
    Boolean(value.id) &&
    typeof value.method === 'string' &&
    Boolean(value.method)
  )
}

const isDappRpcResponse = (value: unknown): value is DappRpcResponse => {
  if (!isObject(value)) return false
  return (
    value.channel === DAPP_CHANNEL &&
    value.source === CONTENT_SOURCE &&
    typeof value.id === 'string' &&
    Boolean(value.id) &&
    typeof value.ok === 'boolean'
  )
}

const isDappEventMessage = (value: unknown): value is DappEventMessage => {
  if (!isObject(value)) return false
  return (
    value.channel === DAPP_CHANNEL &&
    value.source === CONTENT_SOURCE &&
    typeof value.event === 'string' &&
    Boolean(value.event)
  )
}

const isDappRuntimeEventEnvelope = (value: unknown): value is DappRuntimeEventEnvelope => {
  if (!isObject(value)) return false
  return value.type === RUNTIME_EVENT_TYPE && isDappEventMessage(value.payload)
}

const isRuntimePendingAck = (value: unknown): value is DappRuntimePendingAck => {
  if (!isObject(value)) return false
  return value.pending === true && typeof value.id === 'string' && Boolean(value.id)
}

const getChromeApi = () =>
  (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome ?? null

const getChromeRuntime = () => getChromeApi()?.runtime ?? null

const createSessionToken = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const getOrCreateSessionToken = () => {
  const root = document.documentElement
  const existing = root?.getAttribute(INPAGE_SESSION_DOM_ATTR)?.trim()
  if (existing && /^[0-9a-f]{32}$/i.test(existing)) return existing

  const created = createSessionToken()
  root?.setAttribute(INPAGE_SESSION_DOM_ATTR, created)
  return created
}

const inpageSession = getOrCreateSessionToken()

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

const postToPage = (message: DappRpcResponse | DappEventMessage, session = inpageSession) => {
  window.postMessage({ ...message, session }, '*')
}

const sendFailure = (
  id: string,
  message: string,
  code: DappProviderErrorCode = 'INTERNAL_ERROR',
  session = inpageSession,
) => {
  postToPage({
    channel: DAPP_CHANNEL,
    source: CONTENT_SOURCE,
    id,
    ok: false,
    error: { code, message },
  }, session)
}

const pollRuntimeResult = (
  id: string,
  session: string,
  runtime: NonNullable<typeof chrome.runtime>,
  chromeApi: typeof chrome,
  startedAt = Date.now(),
) => {
  if (Date.now() - startedAt > DAPP_APPROVAL_TIMEOUT_MS) {
    sendFailure(id, 'Provider request timed out', 'INTERNAL_ERROR', session)
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
        sendFailure(id, 'Invalid response from extension runtime', 'INTERNAL_ERROR', session)
        return
      }
      postToPage(response, session)
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
    sendFailure(data.id, 'Extension runtime is not available', 'INTERNAL_ERROR', inpageSession)
    return
  }

  runtime.sendMessage({ type: RUNTIME_REQUEST_TYPE, payload: data }, (response: unknown) => {
    const maybeError = chromeApi?.runtime?.lastError
    if (maybeError) {
      sendFailure(
        data.id,
        maybeError.message || 'Failed to reach extension runtime',
        'INTERNAL_ERROR',
        inpageSession,
      )
      return
    }
    if (isRuntimePendingAck(response)) {
      pollRuntimeResult(data.id, inpageSession, runtime, chromeApi)
      return
    }
    if (!isDappRpcResponse(response) || response.source !== CONTENT_SOURCE) {
      sendFailure(data.id, 'Invalid response from extension runtime', 'INTERNAL_ERROR', inpageSession)
      return
    }
    postToPage(response, inpageSession)
  })
})

getChromeApi()?.runtime?.onMessage?.addListener((message: unknown) => {
  if (!isDappRuntimeEventEnvelope(message) || message.type !== RUNTIME_EVENT_TYPE) return
  postToPage(message.payload)
})

injectProviderScript()
