import type {
  DappProviderErrorCode,
  DappRpcResponse,
  DappRuntimePendingAck,
} from '@/lib/dapp/protocol'

export const asDappSuccess = (id: string, result: unknown): DappRpcResponse => ({
  channel: 'qubic:dapp',
  source: 'qubic:content',
  id,
  ok: true,
  result,
})

export const asDappFailure = (
  id: string,
  code: DappProviderErrorCode,
  message: string,
): DappRpcResponse => ({
  channel: 'qubic:dapp',
  source: 'qubic:content',
  id,
  ok: false,
  error: { code, message },
})

export const asRuntimePendingAck = (id: string): DappRuntimePendingAck => ({ pending: true, id })

export const isRuntimePendingAck = (value: unknown): value is DappRuntimePendingAck => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return record.pending === true && typeof record.id === 'string' && Boolean(record.id)
}
