type DappApprovalMethod = 'connect' | 'signMessage' | 'signTransaction'

export type DappTxApprovalSummary = Readonly<{
  toIdentity: string
  amount: string
  inputType: string
  targetTick: string
}>

const truncatePreviewValue = (value: string, max = 280) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value

export const buildApprovalParamsPreview = (
  method: DappApprovalMethod,
  params: unknown,
): unknown => {
  if (!params || typeof params !== 'object') {
    if (method === 'signMessage' && typeof params === 'string') {
      return truncatePreviewValue(params)
    }
    return undefined
  }

  const record = params as Record<string, unknown>
  if (method === 'signMessage') {
    if (typeof record.message === 'string') return { message: truncatePreviewValue(record.message) }
    if (typeof record.hex === 'string') return { hex: truncatePreviewValue(record.hex) }
    if (typeof record.base64 === 'string') return { base64: truncatePreviewValue(record.base64) }
    return undefined
  }

  if (method === 'signTransaction') {
    const preview: Record<string, string | number> = {}
    if (typeof record.toIdentity === 'string') preview.toIdentity = record.toIdentity
    if (typeof record.amount === 'string' || typeof record.amount === 'number') {
      preview.amount = record.amount
    }
    if (typeof record.inputType === 'string' || typeof record.inputType === 'number') {
      preview.inputType = record.inputType
    }
    if (typeof record.targetTick === 'string' || typeof record.targetTick === 'number') {
      preview.targetTick = record.targetTick
    }
    return Object.keys(preview).length > 0 ? preview : undefined
  }

  return undefined
}

export const getApprovalMessagePreview = (params: unknown): string => {
  if (typeof params === 'string') return params
  if (!params || typeof params !== 'object') return ''
  const record = params as Record<string, unknown>
  if (typeof record.message === 'string') return record.message
  if (typeof record.hex === 'string') return record.hex
  if (typeof record.base64 === 'string') return record.base64
  return ''
}

export const getApprovalTxSummary = (params: unknown): DappTxApprovalSummary | null => {
  if (!params || typeof params !== 'object') return null
  const record = params as Record<string, unknown>
  const toIdentity = typeof record.toIdentity === 'string' ? record.toIdentity : ''
  const amount =
    typeof record.amount === 'string' || typeof record.amount === 'number' ? `${record.amount}` : ''
  const inputType =
    typeof record.inputType === 'string' || typeof record.inputType === 'number'
      ? `${record.inputType}`
      : ''
  const targetTick =
    typeof record.targetTick === 'string' || typeof record.targetTick === 'number'
      ? `${record.targetTick}`
      : ''
  if (!toIdentity && !amount && !inputType && !targetTick) return null
  return { toIdentity, amount, inputType, targetTick }
}
