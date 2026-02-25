import { getChromeApi, getChromeRuntime } from '@/lib/dapp/chrome-api'
import {
  CONTENT_SOURCE,
  DAPP_CHANNEL,
  RUNTIME_REQUEST_TYPE,
  RUNTIME_REQUEST_STATUS_TYPE,
  type DappProviderErrorCode,
  type DappEventMessage,
  type DappRpcFailure,
  type DappRpcResponse,
  type DappRuntimePendingAck,
  isDappRpcRequest,
} from '@/lib/dapp/protocol'
import { isRuntimePendingAck } from '@/lib/dapp/responses'
import { dappRuntimeEventEnvelopeSchema } from '@/lib/dapp/schemas'
import { DAPP_APPROVAL_TIMEOUT_MS, DAPP_STATUS_POLL_INTERVAL_MS } from '@/lib/dapp/timing'
const INPAGE_SCRIPT_PATH = 'assets/inpage-provider.js'
const INPAGE_SESSION_DATA_ATTR = 'qubicSession'

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
  const payload: DappRpcFailure = {
    channel: DAPP_CHANNEL,
    source: CONTENT_SOURCE,
    id,
    ok: false,
    error: { code, message },
  }
  postToPage(payload)
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

  const chromeApi = getChromeApi()
  const runtime = getChromeRuntime()
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

const chromeApi = getChromeApi()
chromeApi?.runtime?.onMessage?.addListener((message: unknown) => {
  const parsed = dappRuntimeEventEnvelopeSchema.safeParse(message)
  if (!parsed.success) return
  postToPage(parsed.data.payload)
})

injectProviderScript()
