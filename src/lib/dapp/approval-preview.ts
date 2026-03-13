import type { DappApprovalMethod } from '@/lib/dapp/protocol'

export type DappConnectApprovalSummary = Readonly<{
  accountIdentity: string
  accountName?: string
}>

export type DappTxApprovalSummary = Readonly<{
  toIdentity: string
  amount: string
  inputType: string
  targetTick: string
  targetTickOffset?: string
  fee: string
}>

export type DappMessageWarning = 'encoded' | 'url' | 'sensitiveTerms' | 'long'

type ApprovalPreviewOptions = {
  account?: {
    identity: string
    name?: string
  }
}

const truncatePreviewValue = (value: string, max = 280) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value

export const buildApprovalParamsPreview = (
  method: DappApprovalMethod,
  params: unknown,
  options: ApprovalPreviewOptions = {},
): unknown => {
  if (method === 'connect') {
    if (!options.account?.identity) return undefined
    return {
      accountIdentity: options.account.identity,
      accountName: options.account.name,
    }
  }

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

  if (method === 'signTransaction' || method === 'sendTransaction') {
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
    if (
      typeof record.targetTickOffset === 'string' ||
      typeof record.targetTickOffset === 'number'
    ) {
      preview.targetTickOffset = record.targetTickOffset
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

export const getApprovalMessageWarnings = (params: unknown): DappMessageWarning[] => {
  const warnings = new Set<DappMessageWarning>()
  const message = getApprovalMessagePreview(params)

  if (message.length > 180) warnings.add('long')
  if (/(https?:\/\/|www\.)/i.test(message)) warnings.add('url')
  if (
    /\b(seed|mnemonic|recovery|private key|passphrase|authorize|approval|transaction|transfer)\b/i.test(
      message,
    )
  ) {
    warnings.add('sensitiveTerms')
  }

  if (params && typeof params === 'object') {
    const record = params as Record<string, unknown>
    if (typeof record.hex === 'string' || typeof record.base64 === 'string') {
      warnings.add('encoded')
    }
  }

  return Array.from(warnings)
}

export const getApprovalConnectSummary = (params: unknown): DappConnectApprovalSummary | null => {
  if (!params || typeof params !== 'object') return null
  const record = params as Record<string, unknown>
  const accountIdentity = typeof record.accountIdentity === 'string' ? record.accountIdentity : ''
  const accountName = typeof record.accountName === 'string' ? record.accountName : undefined
  if (!accountIdentity) return null
  return { accountIdentity, accountName }
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
  const targetTickOffset =
    typeof record.targetTickOffset === 'string' || typeof record.targetTickOffset === 'number'
      ? `${record.targetTickOffset}`
      : undefined
  const inputTypeNumber =
    typeof record.inputType === 'string' || typeof record.inputType === 'number'
      ? Number(record.inputType)
      : Number.NaN
  const fee = Number.isFinite(inputTypeNumber) && inputTypeNumber === 0 ? '0' : 'may-apply'
  if (!toIdentity && !amount && !inputType && !targetTick) return null
  return { toIdentity, amount, inputType, targetTick, targetTickOffset, fee }
}
