import { useQuery } from '@tanstack/react-query'

export type LatestStatsResponse = {
  data?: {
    timestamp?: string
    circulatingSupply?: string
    activeAddresses?: number
    price?: number
    marketCap?: string
    epoch?: number
    currentTick?: number
    ticksInCurrentEpoch?: number
    emptyTicksInCurrentEpoch?: number
    epochTickQuality?: number
    burnedQus?: string
  }
}

export const fetchLatestStats = async (): Promise<LatestStatsResponse> => {
  const response = await fetch('https://rpc.qubic.org/v1/latest-stats')
  if (!response.ok) {
    throw new Error('Failed to load network stats.')
  }
  return response.json() as Promise<LatestStatsResponse>
}

export const useLatestStats = (
  scope: string,
  options?: {
    enabled?: boolean
    refetchInterval?: number | false
    staleTime?: number
    gcTime?: number
  },
) =>
  useQuery({
    queryKey: ['qubic', 'latest-stats', scope],
    queryFn: fetchLatestStats,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 15_000,
    staleTime: options?.staleTime ?? 3_000,
    gcTime: options?.gcTime ?? 120_000,
  })
