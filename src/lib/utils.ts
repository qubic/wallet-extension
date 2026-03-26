import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { QUBIC_EXPLORER_BASE_URL } from './config/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate Qubic identity format (60 uppercase letters A-Z)
 */
export const isValidIdentity = (identity: string): boolean => {
  if (identity.length !== 60) return false
  for (const char of identity) {
    if (char < 'A' || char > 'Z') return false
  }
  return true
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

const standardFormatter = new Intl.NumberFormat('en', { notation: 'standard' })
const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

/**
 * Format a number with commas (e.g. 1,000,000). Use for any numeric display.
 */
export const formatNumber = (value: number | bigint): string => {
  return standardFormatter.format(value as number)
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

export function truncateString(value: string, options: TruncateStringOptions = {}) {
  const { leading = 6, trailing = 6, minLength = 12, emptyLabel = 'No identity' } = options

  if (!value) return emptyLabel
  if (value.length <= minLength) return value
  return `${value.slice(0, leading)}…${value.slice(-trailing)}`
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

export function buildExplorerObjectUrl(object: ExplorerObject, id: string) {
  const pathMap: Record<ExplorerObject, string> = {
    tx: 'network/tx',
  }

  return `${QUBIC_EXPLORER_BASE_URL}/${pathMap[object]}/${id}`
}
