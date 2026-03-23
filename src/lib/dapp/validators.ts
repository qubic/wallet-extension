import { z } from 'zod'
import type { DappMethod } from '@/lib/dapp/protocol'
import { DappProviderError } from '@/lib/dapp/errors'

const signTransactionSchema = z.record(z.string(), z.unknown())
const signMessageSchema = z.union([z.string(), z.record(z.string(), z.unknown())])

/**
 * Parse an optional integer from unknown input.
 * Returns `undefined` for null/undefined. Throws `INVALID_PARAMS` for present but invalid values.
 */
export const parseOptionalInteger = (value: unknown, field: string): number | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string' && value.trim() === '') {
    throw new DappProviderError('INVALID_PARAMS', `Invalid ${field}`)
  }
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'bigint'
        ? Number(value)
        : typeof value === 'string'
          ? Number(value.trim())
          : Number.NaN
  if (!Number.isInteger(numeric)) {
    throw new DappProviderError('INVALID_PARAMS', `Invalid ${field}`)
  }
  return numeric
}

export const validateDappMethodParams = (method: DappMethod, params: unknown) => {
  switch (method) {
    case 'connect':
    case 'disconnect':
    case 'getAccount':
      return undefined
    case 'signTransaction':
    case 'sendTransaction':
      return signTransactionSchema.parse(params ?? {})
    case 'signMessage':
      return signMessageSchema.parse(params ?? '')
    default:
      return undefined
  }
}
