import { isRequestedTargetTickExpiredNow } from '@/lib/target-tick'

type RequestedTargetTick = bigint | number | undefined

type TransactionSubmissionErrorMessages = {
  generic: string
  targetTickExpired: string
  networkError: string
  broadcastFailed: string
}

export const resolveTransactionSubmissionErrorMessage = async (
  error: unknown,
  requestedTargetTick: RequestedTargetTick,
  messages: TransactionSubmissionErrorMessages,
): Promise<string> => {
  if (!(error instanceof Error)) return messages.generic

  if (await isRequestedTargetTickExpiredNow(requestedTargetTick)) {
    return messages.targetTickExpired
  }

  const errorMessage = error.message.toLowerCase()

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return messages.networkError
  }

  if (errorMessage.includes('broadcast')) {
    return messages.broadcastFailed
  }

  return error.message
}
