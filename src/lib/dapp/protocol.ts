export const DAPP_CHANNEL = 'qubic:dapp'
export const INPAGE_SOURCE = 'qubic:inpage'
export const CONTENT_SOURCE = 'qubic:content'
export const RUNTIME_REQUEST_TYPE = 'qubic:dapp:request'
export const RUNTIME_EVENT_TYPE = 'qubic:dapp:event'
export const RUNTIME_APPROVAL_DECISION_TYPE = 'qubic:dapp:approval-decision'
export const RUNTIME_REQUEST_STATUS_TYPE = 'qubic:dapp:request-status'

export type DappMethod = 'connect' | 'getAccount' | 'signTransaction' | 'signMessage' | 'disconnect'

export type DappEvent = 'accountChanged' | 'disconnect'
export type DappProviderErrorCode =
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
export type DappApprovalDecision = Readonly<{
  id: string
  approved: boolean
  passphrase?: string
}>
export type DappProviderAccount = Readonly<{
  identity: string
  name?: string
}>
export type DappConnectResult = Readonly<{
  connected: true
  origin: string
}>
export type DappDisconnectResult = Readonly<{
  disconnected: true
}>
export type DappSignMessageResult = Readonly<{
  signatureHex: string
  digestHex: string
}>
export type DappSignTransactionResult = Readonly<{
  txId: string
  targetTick: number
  txBytesBase64: string
  txBytesHex: string
}>
export type DappMethodResultMap = {
  connect: DappConnectResult
  getAccount: DappProviderAccount | null
  signTransaction: DappSignTransactionResult
  signMessage: DappSignMessageResult
  disconnect: DappDisconnectResult
}

export type DappRpcRequest = Readonly<{
  channel: typeof DAPP_CHANNEL
  source: typeof INPAGE_SOURCE
  id: string
  method: DappMethod
  params?: unknown
  session?: string
}>

export type DappRpcSuccess = Readonly<{
  channel: typeof DAPP_CHANNEL
  source: typeof CONTENT_SOURCE
  id: string
  ok: true
  result: unknown
  session?: string
}>

export type DappRpcFailure = Readonly<{
  channel: typeof DAPP_CHANNEL
  source: typeof CONTENT_SOURCE
  id: string
  ok: false
  error: {
    code: DappProviderErrorCode
    message: string
  }
  session?: string
}>

export type DappRpcResponse = DappRpcSuccess | DappRpcFailure

export type DappRuntimePendingAck = Readonly<{
  pending: true
  id: string
}>

export type DappRuntimeRequestStatusPayload = Readonly<{
  id: string
  session: string
}>

export type DappEventMessage = Readonly<{
  channel: typeof DAPP_CHANNEL
  source: typeof CONTENT_SOURCE
  event: DappEvent
  payload?: unknown
  session?: string
}>

export const isDappRpcRequest = (value: unknown): value is DappRpcRequest => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (record.channel !== DAPP_CHANNEL) return false
  if (record.source !== INPAGE_SOURCE) return false
  if (typeof record.id !== 'string' || !record.id) return false
  if (typeof record.method !== 'string' || !record.method) return false
  return true
}

export const isDappRpcResponse = (value: unknown): value is DappRpcResponse => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (record.channel !== DAPP_CHANNEL) return false
  if (record.source !== CONTENT_SOURCE) return false
  if (typeof record.id !== 'string' || !record.id) return false
  if (typeof record.ok !== 'boolean') return false
  return true
}

export const isDappEventMessage = (value: unknown): value is DappEventMessage => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (record.channel !== DAPP_CHANNEL) return false
  if (record.source !== CONTENT_SOURCE) return false
  if (typeof record.event !== 'string' || !record.event) return false
  return true
}
