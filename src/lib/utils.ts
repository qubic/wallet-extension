import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { QUBIC_EXPLORER_BASE_URL } from './constants'

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

/**
 * Format balance for display with full precision (standard notation)
 */
export const formatBalance = (value: bigint): string => {
  return new Intl.NumberFormat('en', {
    notation: 'standard',
  }).format(value)
}

/**
 * Format balance for display with compact notation (e.g., 1.5B, 2.3M)
 */
export const formatBalanceCompact = (value: bigint): string => {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(Number(value))
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

export type ExplorerObject = 'tx'

export function buildExplorerObjectUrl(object: ExplorerObject, id: string) {
  const pathMap: Record<ExplorerObject, string> = {
    tx: 'network/tx',
  }

  return `${QUBIC_EXPLORER_BASE_URL}/${pathMap[object]}/${id}`
}
