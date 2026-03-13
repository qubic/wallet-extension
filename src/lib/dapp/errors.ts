import type { DappProviderErrorCode } from '@/lib/dapp/protocol'

export class DappProviderError extends Error {
  code: DappProviderErrorCode

  constructor(code: DappProviderErrorCode, message: string) {
    super(message)
    this.name = 'DappProviderError'
    this.code = code
  }
}

export const asProviderError = (
  error: unknown,
  fallback: { code: DappProviderErrorCode; message: string },
): { code: DappProviderErrorCode; message: string } => {
  if (error instanceof DappProviderError) {
    return { code: error.code, message: error.message }
  }
  if (error instanceof Error) {
    return { code: fallback.code, message: error.message || fallback.message }
  }
  return fallback
}
