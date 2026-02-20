import { privateKeyFromSeed, publicKeyFromSeed } from '@qubic-labs/core'
import { sign as signSchnorr, k12 } from '@qubic-labs/schnorrq'
import type { BuiltTransaction, TransactionHelpers } from '@qubic-labs/sdk'
import { DappProviderError } from '@/lib/dapp/errors'
import { isValidIdentity, parseAmount } from '@/lib/utils'

const bytesToHex = (value: Uint8Array) =>
  Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('')

const hexToBytes = (hex: string) =>
  Uint8Array.from(hex.match(/.{1,2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? [])

const bytesToBase64 = (value: Uint8Array) => btoa(String.fromCharCode(...value))

const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

type RawSignTransactionParams = {
  toIdentity?: unknown
  amount?: unknown
  targetTick?: unknown
  inputType?: unknown
  inputBytes?: unknown
}

type ParsedSignTransactionParams = Readonly<{
  toIdentity: string
  amount: bigint
  targetTick?: number
  inputType?: number
  inputBytes?: Uint8Array
}>

const toBigInt = (value: unknown, field: string): bigint => {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value))
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d+$/.test(trimmed)) return BigInt(trimmed)
  }
  throw new DappProviderError('INVALID_PARAMS', `Invalid ${field}`)
}

const toNumberOrUndefined = (value: unknown, field: string): number | undefined => {
  if (value === undefined || value === null) return undefined
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'bigint'
        ? Number(value)
        : typeof value === 'string'
          ? Number.parseInt(value, 10)
          : Number.NaN
  if (!Number.isFinite(numeric)) {
    throw new DappProviderError('INVALID_PARAMS', `Invalid ${field}`)
  }
  return Math.trunc(numeric)
}

const decodeInputBytes = (value: unknown): Uint8Array | undefined => {
  if (value === undefined || value === null) return undefined

  if (value instanceof Uint8Array) return value
  if (
    Array.isArray(value) &&
    value.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)
  ) {
    return Uint8Array.from(value)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    if (/^0x[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
      return hexToBytes(trimmed.slice(2))
    }
    try {
      return base64ToBytes(trimmed)
    } catch {
      throw new DappProviderError('INVALID_PARAMS', 'Invalid inputBytes encoding')
    }
  }

  throw new DappProviderError('INVALID_PARAMS', 'Invalid inputBytes')
}

export const parseSignTransactionParams = (params: unknown): ParsedSignTransactionParams => {
  const input = (params && typeof params === 'object' ? params : {}) as RawSignTransactionParams
  const toIdentity =
    typeof input.toIdentity === 'string' ? input.toIdentity.trim().toUpperCase() : ''
  if (!isValidIdentity(toIdentity)) {
    throw new DappProviderError('INVALID_PARAMS', 'Invalid toIdentity')
  }

  const parsedAmount =
    typeof input.amount === 'string' ? parseAmount(input.amount) : toBigInt(input.amount, 'amount')
  if (!parsedAmount || parsedAmount < 0n) {
    throw new DappProviderError('INVALID_PARAMS', 'Invalid amount')
  }

  const targetTick = toNumberOrUndefined(input.targetTick, 'targetTick')
  const inputType = toNumberOrUndefined(input.inputType, 'inputType')
  const inputBytes = decodeInputBytes(input.inputBytes)

  return {
    toIdentity,
    amount: parsedAmount,
    targetTick,
    inputType,
    inputBytes,
  }
}

const parseMessageBytes = (params: unknown): Uint8Array => {
  if (typeof params === 'string') {
    return new TextEncoder().encode(params)
  }

  if (!params || typeof params !== 'object') {
    throw new DappProviderError('INVALID_PARAMS', 'Invalid message payload')
  }

  const record = params as Record<string, unknown>
  if (typeof record.message === 'string') {
    return new TextEncoder().encode(record.message)
  }
  if (
    typeof record.hex === 'string' &&
    /^0x[0-9a-fA-F]+$/.test(record.hex) &&
    record.hex.length % 2 === 0
  ) {
    return hexToBytes(record.hex.slice(2))
  }
  if (typeof record.base64 === 'string') {
    return base64ToBytes(record.base64)
  }
  throw new DappProviderError('INVALID_PARAMS', 'Invalid message payload')
}

export const signMessageFromSeed = async (seed: string, params: unknown) => {
  const messageBytes = parseMessageBytes(params)
  const digest = k12(messageBytes, 32)
  const privateKey = await privateKeyFromSeed(seed)
  const publicKey = await publicKeyFromSeed(seed)
  const signature = signSchnorr(privateKey, publicKey, digest)

  return {
    signatureHex: bytesToHex(signature),
    digestHex: bytesToHex(digest),
  }
}

export const signTransactionFromSeed = async (
  seed: string,
  params: unknown,
  transactions: TransactionHelpers,
): Promise<{
  txId: string
  targetTick: number
  txBytesBase64: string
  txBytesHex: string
}> => {
  const parsed = parseSignTransactionParams(params)
  const built: BuiltTransaction = await transactions.buildSigned({
    fromSeed: seed,
    ...parsed,
  })

  return {
    txId: built.txId,
    targetTick: Number(built.targetTick),
    txBytesBase64: bytesToBase64(built.txBytes),
    txBytesHex: bytesToHex(built.txBytes),
  }
}
