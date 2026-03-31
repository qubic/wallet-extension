import { fetchTickInfo } from '@/lib/network-stats'

export const isRequestedTargetTickExpired = (
  requestedTargetTick: bigint | number | undefined,
  currentTick: number | undefined,
): boolean => {
  if (requestedTargetTick === undefined || typeof currentTick !== 'number') return false
  const normalizedTargetTick =
    typeof requestedTargetTick === 'bigint' ? Number(requestedTargetTick) : requestedTargetTick
  if (!Number.isFinite(normalizedTargetTick)) return false
  return normalizedTargetTick <= currentTick
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
