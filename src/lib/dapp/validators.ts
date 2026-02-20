import { z } from 'zod'
import type { DappMethod } from '@/lib/dapp/protocol'

const signTransactionSchema = z.record(z.string(), z.unknown())
const signMessageSchema = z.union([z.string(), z.record(z.string(), z.unknown())])

export const validateDappMethodParams = (method: DappMethod, params: unknown) => {
  switch (method) {
    case 'connect':
    case 'disconnect':
    case 'getAccount':
      return undefined
    case 'signTransaction':
      return signTransactionSchema.parse(params ?? {})
    case 'signMessage':
      return signMessageSchema.parse(params ?? '')
    default:
      return undefined
  }
}
