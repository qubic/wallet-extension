import { useQuery } from '@tanstack/react-query'
import {
  REFRESH_INTERVAL_LATEST_STATS,
  REFRESH_INTERVAL_TICK_INFO,
  STALE_TIME_LATEST_STATS,
  STALE_TIME_TICK_INFO,
  GC_TIME_LATEST_STATS,
  GC_TIME_TICK_INFO,
} from './config/refresh-intervals'
import { QUBIC_RPC_BASE_URL } from './config/constants'

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

export type TickInfoResponse = {
  tickInfo?: {
    tick?: number
    duration?: number
    epoch?: number
    initialTick?: number
  }
}

export const fetchLatestStats = async (): Promise<LatestStatsResponse> => {
  const response = await fetch(`${QUBIC_RPC_BASE_URL}/v1/latest-stats`)
  if (!response.ok) {
    throw new Error('Failed to load network stats.')
  }
  return response.json() as Promise<LatestStatsResponse>
}

export const fetchTickInfo = async (): Promise<TickInfoResponse> => {
  const response = await fetch(`${QUBIC_RPC_BASE_URL}/v1/live/tick-info`)
  if (!response.ok) {
    throw new Error('Failed to load tick info.')
  }
  return response.json() as Promise<TickInfoResponse>
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
    refetchInterval: options?.refetchInterval ?? REFRESH_INTERVAL_LATEST_STATS,
    staleTime: options?.staleTime ?? STALE_TIME_LATEST_STATS,
    gcTime: options?.gcTime ?? GC_TIME_LATEST_STATS,
  })

export const useTickInfo = (
  scope: string,
  options?: {
    enabled?: boolean
    refetchInterval?: number | false
    staleTime?: number
    gcTime?: number
  },
) =>
  useQuery({
    queryKey: ['qubic', 'tick-info', scope],
    queryFn: fetchTickInfo,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? REFRESH_INTERVAL_TICK_INFO,
    staleTime: options?.staleTime ?? STALE_TIME_TICK_INFO,
    gcTime: options?.gcTime ?? GC_TIME_TICK_INFO,
  })
