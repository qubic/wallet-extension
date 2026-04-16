import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { verifyIdentity } from '@qubic-labs/core'
import { QUBIC_EXPLORER_BASE_URL } from './config/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate a Qubic identity by checking both its 60-character uppercase format
 * and checksum.
 */
export const isValidIdentity = (identity: string): boolean => {
  return /^[A-Z]{60}$/.test(identity) && verifyIdentity(identity)
}

/**
 * Normalize balance to bigint from various input types
 */
export const normalizeBalance = (value: bigint | number | string | undefined): bigint => {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(Math.floor(value))
  if (typeof value === 'string') return BigInt(value)
  return 0n
}

/**
 * Parse amount string to bigint, handling commas and validation
 */
export const parseAmount = (str: string): bigint | null => {
  const cleaned = str.trim().replace(/,/g, '')
  if (!cleaned || !/^\d+$/.test(cleaned)) return null
  return BigInt(cleaned)
}

/**
 * Parse a formatted number string from various locale formats to an integer.
 * Supports US (1,234), EU (1.234), and Swiss (1'234) thousand separators.
 * Decimals are stripped (Qubic only supports integers).
 * Returns null for invalid or empty values.
 */
export const parseFormattedInteger = (value: string): bigint | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (/^(\d{1,3}(,\d{3})*|\d+)(\.\d+)?$/.test(trimmed)) {
    const integerPart = trimmed.split('.')[0]
    return BigInt(integerPart.replace(/,/g, ''))
  }
  if (/^(\d{1,3}(\.\d{3})+|\d+)(,\d+)?$/.test(trimmed)) {
    const integerPart = trimmed.split(',')[0]
    return BigInt(integerPart.replace(/\./g, ''))
  }
  if (/^\d{1,3}('\d{3})+(\.\d+)?$/.test(trimmed)) {
    const integerPart = trimmed.split('.')[0]
    return BigInt(integerPart.replace(/'/g, ''))
  }
  return null
}

const standardFormatter = new Intl.NumberFormat('en', { notation: 'standard' })
const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

/**
 * Normalize a numeric timestamp to milliseconds.
 * Timestamps below 1e12 are treated as seconds and multiplied by 1000.
 */
const SECONDS_VS_MILLIS_THRESHOLD = 1e12
export const toTimestampMs = (ts: number): number =>
  ts > SECONDS_VS_MILLIS_THRESHOLD ? ts : ts * 1000

/**
 * Format a number with commas (e.g. 1,000,000). Use for any numeric display.
 */
export const formatNumber = (value: number | bigint): string => {
  return standardFormatter.format(value as number)
}

/**
 * Format an integer-like value (number, bigint, or numeric string) for display.
 * Returns '--' for null/undefined/non-finite values.
 */
export const formatIntegerLike = (value: unknown): string => {
  if (value === null || value === undefined) return '--'
  if (typeof value === 'bigint') return formatNumber(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '--'
    return formatNumber(Math.trunc(value))
  }
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (/^-?\d+$/.test(normalized)) return formatNumber(BigInt(normalized))
  }
  return String(value)
}

/**
 * Format balance for display with full precision (standard notation)
 */
export const formatBalance = (value: bigint): string => {
  return formatNumber(value)
}

/**
 * Format balance for display with compact notation (e.g., 1.5B, 2.3M)
 */
export const formatBalanceCompact = (value: bigint): string => {
  return compactFormatter.format(Number(value))
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

/**
 * Format a number as USD currency (e.g. $1,234.56)
 */
export const formatUsd = (value: number): string => {
  return usdFormatter.format(value)
}

type TruncateStringOptions = {
  leading?: number
  trailing?: number
  minLength?: number
  emptyLabel?: string
}

export type TruncateAccountNameOptions = {
  maxLength?: number
}

export type TruncateAccountNameResult = {
  text: string
  isTruncated: boolean
}

export function truncateString(value: string, options: TruncateStringOptions = {}) {
  const { leading = 6, trailing = 6, minLength = 12, emptyLabel = 'No identity' } = options

  if (!value) return emptyLabel
  if (value.length <= minLength) return value
  return `${value.slice(0, leading)}…${value.slice(-trailing)}`
}

export function truncateAccountName(
  value: string,
  options: TruncateAccountNameOptions = {},
): TruncateAccountNameResult {
  const { maxLength = 24 } = options

  if (value.length <= maxLength) {
    return { text: value, isTruncated: false }
  }

  return {
    text: `${value.slice(0, Math.max(0, maxLength - 1))}…`,
    isTruncated: true,
  }
}

export const formatAddressLabel = (
  address: string,
  name?: string,
  options?: TruncateStringOptions,
): string => {
  const truncated = truncateString(address, options)
  if (!name) return truncated
  return `${name} (${truncated})`
}

export type ExplorerObject = 'tx'

export const compareBigIntDesc = (a: string, b: string): number => {
  const diff = BigInt(b) - BigInt(a)
  return diff > 0n ? 1 : diff < 0n ? -1 : 0
}

export function buildExplorerObjectUrl(
  object: ExplorerObject,
  id: string,
  params?: Record<string, string | number>,
) {
  const pathMap: Record<ExplorerObject, string> = {
    tx: 'network/tx',
  }

  const url = `${QUBIC_EXPLORER_BASE_URL}/${pathMap[object]}/${id}`
  if (!params) return url

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value))
  }
  return `${url}?${searchParams.toString()}`
}
