import { fetchTickInfo } from '@/lib/network-stats'

const isRequestedTargetTickExpired = (
  requestedTargetTick: bigint | number | undefined,
  currentTick: number | undefined,
): boolean => {
  if (
    requestedTargetTick === undefined ||
    typeof currentTick !== 'number' ||
    !Number.isInteger(currentTick)
  ) {
    return false
  }

  if (typeof requestedTargetTick === 'number' && !Number.isInteger(requestedTargetTick)) {
    return false
  }

  const targetTick =
    typeof requestedTargetTick === 'bigint' ? requestedTargetTick : BigInt(requestedTargetTick)

  // A transaction aimed at the tick already being processed can no longer be
  // included, so treat it as expired — matching the pre-submit validation.
  return targetTick <= BigInt(currentTick)
}

export const isRequestedTargetTickExpiredNow = async (
  requestedTargetTick: bigint | number | undefined,
): Promise<boolean> => {
  if (requestedTargetTick === undefined) return false
  try {
    const latestTickInfo = await fetchTickInfo()
    return isRequestedTargetTickExpired(requestedTargetTick, latestTickInfo.tickInfo?.tick)
  } catch {
    return false
  }
}
