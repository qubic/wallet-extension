import { isRequestedTargetTickExpiredNow } from '@/lib/target-tick'

type RequestedTargetTick = bigint | number | undefined

const TARGET_TICK_EXPIRED_ERROR_CODE = 'tx_target_tick_expired'
const VALIDATION_ERROR_CODE = 'tx_validation'
// Error codes raised by @qubic-labs/sdk: the request never completed vs. the
// node answering with a non-2xx status.
const RPC_FETCH_ERROR_CODE = 'rpc_fetch_error'
const RPC_REQUEST_FAILED_CODE = 'rpc_request_failed'

/**
 * Raised by the wallet itself before a transaction is submitted. The message is
 * already localized, so it must be surfaced as-is — running it through the
 * message matching below would misread wording such as "current network tick"
 * as a network failure.
 */
export class TransactionValidationError extends Error {
  readonly code: string

  constructor(message: string, code: string = VALIDATION_ERROR_CODE) {
    super(message)
    this.name = 'TransactionValidationError'
    this.code = code
  }
}

export const createTargetTickExpiredError = (message: string) =>
  new TransactionValidationError(message, TARGET_TICK_EXPIRED_ERROR_CODE)

type TransactionSubmissionErrorMessages = {
  generic: string
  targetTickExpired: string
  networkError: string
  broadcastFailed: string
}

const getErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined
  const { code } = error as { code?: unknown }
  return typeof code === 'string' ? code : undefined
}

export const resolveTransactionSubmissionErrorMessage = async (
  error: unknown,
  requestedTargetTick: RequestedTargetTick,
  messages: TransactionSubmissionErrorMessages,
  options?: { allowTickExpiryHeuristic?: boolean },
): Promise<string> => {
  const errorCode = getErrorCode(error)

  if (errorCode === TARGET_TICK_EXPIRED_ERROR_CODE) {
    return messages.targetTickExpired
  }

  if (errorCode === VALIDATION_ERROR_CODE && error instanceof Error) {
    return error.message
  }

  // An expired target tick can also surface from the SDK as a plain transport
  // or rejection error, so confirm it against the live tick before the coarser
  // checks below claim it. If the network is genuinely unreachable this lookup
  // fails and we fall through to the network error instead.
  if (
    options?.allowTickExpiryHeuristic &&
    (await isRequestedTargetTickExpiredNow(requestedTargetTick))
  ) {
    return messages.targetTickExpired
  }

  if (errorCode === RPC_FETCH_ERROR_CODE) return messages.networkError
  if (errorCode === RPC_REQUEST_FAILED_CODE) return messages.broadcastFailed

  if (!(error instanceof Error)) return messages.generic

  const errorMessage = error.message.toLowerCase()

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return messages.networkError
  }

  if (errorMessage.includes('broadcast')) {
    return messages.broadcastFailed
  }

  return error.message
}
