import type { DappApprovalMethod } from '@/lib/dapp/protocol'

export type DappConnectApprovalSummary = Readonly<{
  accountIdentity: string
  accountName?: string
}>

export type DappApprovalAccountSummary = Readonly<{
  accountIdentity: string
  accountName?: string
  accountWatchOnly?: boolean
}>

export type DappTxApprovalSummary = Readonly<{
  toIdentity: string
  amount: string
  inputType: string
  targetTick: string
  targetTickOffset?: string
  inputBytes?: string
}>

type ApprovalPreviewOptions = {
  account?: {
    identity: string
    name?: string
    watchOnly?: boolean
  }
}

const truncatePreviewValue = (value: string, max = 280) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value

const buildAccountPreview = (options: ApprovalPreviewOptions) => {
  const preview: Record<string, string | boolean> = {}
  if (options.account?.identity) preview.accountIdentity = options.account.identity
  if (options.account?.name) preview.accountName = options.account.name
  if (options.account?.watchOnly) preview.accountWatchOnly = true
  return preview
}

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
      return {
        ...buildAccountPreview(options),
        message: truncatePreviewValue(params),
      }
    }
    const accountPreview = buildAccountPreview(options)
    return Object.keys(accountPreview).length > 0 ? accountPreview : undefined
  }

  const record = params as Record<string, unknown>
  if (method === 'signMessage') {
    const preview: Record<string, string | boolean> = buildAccountPreview(options)
    if (typeof record.message === 'string') preview.message = truncatePreviewValue(record.message)
    if (typeof record.hex === 'string') preview.hex = truncatePreviewValue(record.hex)
    if (typeof record.base64 === 'string') preview.base64 = truncatePreviewValue(record.base64)
    return Object.keys(preview).length > 0 ? preview : undefined
  }

  if (method === 'signTransaction' || method === 'sendTransaction') {
    const preview: Record<string, string | number | boolean> = buildAccountPreview(options)
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
    if (typeof record.inputBytes === 'string' && record.inputBytes.trim()) {
      preview.inputBytes = truncatePreviewValue(record.inputBytes.trim())
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

export const getApprovalConnectSummary = (params: unknown): DappConnectApprovalSummary | null => {
  if (!params || typeof params !== 'object') return null
  const record = params as Record<string, unknown>
  const accountIdentity = typeof record.accountIdentity === 'string' ? record.accountIdentity : ''
  const accountName = typeof record.accountName === 'string' ? record.accountName : undefined
  if (!accountIdentity) return null
  return { accountIdentity, accountName }
}

export const getApprovalAccountSummary = (params: unknown): DappApprovalAccountSummary | null => {
  if (!params || typeof params !== 'object') return null
  const record = params as Record<string, unknown>
  const accountIdentity = typeof record.accountIdentity === 'string' ? record.accountIdentity : ''
  const accountName = typeof record.accountName === 'string' ? record.accountName : undefined
  const accountWatchOnly = record.accountWatchOnly === true ? true : undefined
  if (!accountIdentity) return null
  return { accountIdentity, accountName, accountWatchOnly }
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
      : '0'
  const targetTick =
    typeof record.targetTick === 'string' || typeof record.targetTick === 'number'
      ? `${record.targetTick}`
      : ''
  const targetTickOffset =
    typeof record.targetTickOffset === 'string' || typeof record.targetTickOffset === 'number'
      ? `${record.targetTickOffset}`
      : undefined
  const inputBytes =
    typeof record.inputBytes === 'string' && record.inputBytes.trim()
      ? record.inputBytes.trim()
      : undefined
  if (!toIdentity && !amount && !inputType && !targetTick) return null
  return { toIdentity, amount, inputType, targetTick, targetTickOffset, inputBytes }
}
