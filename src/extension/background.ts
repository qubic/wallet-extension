import { asProviderError } from '@/lib/dapp/errors'
import { getOriginFromUrl, normalizeOrigin } from '@/lib/dapp/origin'
import {
  handleDappApprovalDecision,
  handleDappRequestStatus,
  handleDappRpcRequest,
  startupDappController,
} from '@/lib/dapp/controller'
import {
  CONTENT_SOURCE,
  DAPP_CHANNEL,
  RUNTIME_APPROVAL_DECISION_TYPE,
  RUNTIME_EVENT_TYPE,
  RUNTIME_REQUEST_STATUS_TYPE,
  RUNTIME_REQUEST_TYPE,
  type DappEventMessage,
} from '@/lib/dapp/protocol'
import { asDappFailure, asDappSuccess, isRuntimePendingAck } from '@/lib/dapp/responses'
import {
  dappRuntimeApprovalDecisionEnvelopeSchema,
  dappRuntimeEnvelopeBaseSchema,
  dappRuntimeRequestEnvelopeSchema,
  dappRuntimeRequestStatusEnvelopeSchema,
} from '@/lib/dapp/schemas'
import {
  DAPP_CURRENT_ACCOUNT_KEY,
  DAPP_PERMISSIONS_KEY,
  getDappPermissions,
} from '@/lib/dapp/storage'

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  const baseEnvelope = dappRuntimeEnvelopeBaseSchema.safeParse(message)
  if (!baseEnvelope.success) return undefined

  if (baseEnvelope.data.type === RUNTIME_APPROVAL_DECISION_TYPE) {
    if (sender.id !== chrome.runtime.id || sender.tab) {
      sendResponse({ ok: false })
      return undefined
    }

    const parsed = dappRuntimeApprovalDecisionEnvelopeSchema.safeParse(message)
    if (!parsed.success) {
      sendResponse({ ok: false })
      return undefined
    }
    const payload = parsed.data.payload

    void handleDappApprovalDecision(payload)
      .then((ok) => sendResponse({ ok }))
      .catch(() => sendResponse({ ok: false }))
    return true
  }

  if (baseEnvelope.data.type === RUNTIME_REQUEST_STATUS_TYPE) {
    const parsed = dappRuntimeRequestStatusEnvelopeSchema.safeParse(message)
    if (!parsed.success) {
      sendResponse(asDappFailure('unknown', 'INVALID_REQUEST', 'Invalid status payload'))
      return undefined
    }
    const payload = parsed.data.payload

    void handleDappRequestStatus(payload, sender)
      .then((response) => sendResponse(response))
      .catch(() => sendResponse(asDappFailure(payload.id, 'INTERNAL_ERROR', 'Status check failed')))
    return true
  }

  if (baseEnvelope.data.type !== RUNTIME_REQUEST_TYPE) return undefined
  const parsed = dappRuntimeRequestEnvelopeSchema.safeParse(message)
  if (!parsed.success) {
    sendResponse(asDappFailure('unknown', 'INVALID_REQUEST', 'Invalid provider request payload'))
    return undefined
  }
  const payload = parsed.data.payload

  void handleDappRpcRequest(payload, sender)
    .then((result) => {
      if (isRuntimePendingAck(result)) {
        sendResponse(result)
        return
      }
      sendResponse(asDappSuccess(payload.id, result))
    })
    .catch((error) => {
      const normalized = asProviderError(error, {
        code: 'INTERNAL_ERROR',
        message: 'Unhandled provider error',
      })
      sendResponse(asDappFailure(payload.id, normalized.code, normalized.message))
    })

  return true
})

type BroadcastEventOptions = {
  targetOrigin?: string
  onlyConnectedOrigins?: boolean
}

const broadcastEvent = async (event: DappEventMessage, options: BroadcastEventOptions = {}) => {
  const tabs = await chrome.tabs.query({})
  const connectedOrigins = options.onlyConnectedOrigins ? await getDappPermissions() : null
  const normalizedTargetOrigin = options.targetOrigin ? normalizeOrigin(options.targetOrigin) : null

  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue

    const tabOrigin = getOriginFromUrl(tab.url)
    if (!tabOrigin) continue
    const normalizedTabOrigin = normalizeOrigin(tabOrigin)

    if (normalizedTargetOrigin && normalizedTabOrigin !== normalizedTargetOrigin) {
      continue
    }

    if (connectedOrigins && !connectedOrigins[normalizedTabOrigin]) {
      continue
    }

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
    void broadcastEvent(
      {
        channel: DAPP_CHANNEL,
        source: CONTENT_SOURCE,
        event: 'accountChanged',
        payload,
      },
      { onlyConnectedOrigins: true },
    )
  }

  if (changes[DAPP_PERMISSIONS_KEY]) {
    const oldValue = (changes[DAPP_PERMISSIONS_KEY].oldValue ?? {}) as Record<string, unknown>
    const newValue = (changes[DAPP_PERMISSIONS_KEY].newValue ?? {}) as Record<string, unknown>
    const removedOrigins = Object.keys(oldValue).filter((origin) => !(origin in newValue))
    for (const origin of removedOrigins) {
      void broadcastEvent(
        {
          channel: DAPP_CHANNEL,
          source: CONTENT_SOURCE,
          event: 'disconnect',
          payload: { origin },
        },
        { targetOrigin: origin },
      )
    }
  }
})

void startupDappController()
