import { isRequestedTargetTickExpiredNow } from '@/lib/target-tick'

type RequestedTargetTick = bigint | number | undefined
const TARGET_TICK_EXPIRED_ERROR_CODE = 'tx_target_tick_expired'

// Not a plain Error: those are classified by message text below, and the
// past-tick copy ends in "current network tick" — read as a network failure.
export const createTargetTickExpiredError = () =>
  Object.assign(new Error('Target tick has already passed'), {
    code: TARGET_TICK_EXPIRED_ERROR_CODE,
  })

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
  if (getErrorCode(error) === TARGET_TICK_EXPIRED_ERROR_CODE) {
    return messages.targetTickExpired
  }

  if (!(error instanceof Error)) return messages.generic

  const errorMessage = error.message.toLowerCase()

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return messages.networkError
  }

  if (errorMessage.includes('broadcast')) {
    return messages.broadcastFailed
  }

  if (
    options?.allowTickExpiryHeuristic &&
    (await isRequestedTargetTickExpiredNow(requestedTargetTick))
  ) {
    return messages.targetTickExpired
  }

  return error.message
}
