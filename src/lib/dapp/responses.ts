import type {
  DappProviderErrorCode,
  DappRpcResponse,
  DappRuntimePendingAck,
} from '@/lib/dapp/protocol'
import { CONTENT_SOURCE, DAPP_CHANNEL } from '@/lib/dapp/protocol'

export const asDappSuccess = (id: string, result: unknown): DappRpcResponse => ({
  channel: DAPP_CHANNEL,
  source: CONTENT_SOURCE,
  id,
  ok: true,
  result,
})

export const asDappFailure = (
  id: string,
  code: DappProviderErrorCode,
  message: string,
): DappRpcResponse => ({
  channel: DAPP_CHANNEL,
  source: CONTENT_SOURCE,
  id,
  ok: false,
  error: { code, message },
})

export const asRuntimePendingAck = (id: string): DappRuntimePendingAck => ({ pending: true, id })
