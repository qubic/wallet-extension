import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchQutilBalance, fetchQutilBalances, qutilBalanceQueryKey } from '@/lib/qutil-balances'

type UseQutilBalanceOptions = {
  enabled?: boolean
  refetchInterval?: number
}

export const useQutilBalance = (identity: string, options: UseQutilBalanceOptions = {}) => {
  return useQuery({
    ...options,
    queryKey: qutilBalanceQueryKey(identity),
    enabled: Boolean(identity) && (options.enabled ?? true),
    queryFn: () => fetchQutilBalance(identity),
  })
}

type UseQutilBalancesOptions = {
  enabled?: boolean
  refetchInterval?: number
}

/** Batched balances for many identities; seeds each per-identity cache entry. */
export const useQutilBalances = (ids: string[], options: UseQutilBalancesOptions = {}) => {
  const queryClient = useQueryClient()
  const sortedIds = [...ids].sort()
  return useQuery({
    ...options,
    queryKey: ['qubic', 'balances', sortedIds],
    enabled: ids.length > 0 && (options.enabled ?? true),
    queryFn: async () => {
      const map = await fetchQutilBalances(ids)
      for (const [id, balance] of map) {
        queryClient.setQueryData(qutilBalanceQueryKey(id), { balance })
      }
      return map
    },
  })
}
