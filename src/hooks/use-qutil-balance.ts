import { useQuery } from '@tanstack/react-query'
import { fetchQutilBalance, qutilBalanceQueryKey } from '@/lib/qutil-balances'

type UseQutilBalanceOptions = {
  enabled?: boolean
  refetchInterval?: number
}

/** react-query hook for a single identity's QU balance. */
export const useQutilBalance = (identity: string, options: UseQutilBalanceOptions = {}) => {
  return useQuery({
    ...options,
    queryKey: qutilBalanceQueryKey(identity),
    enabled: Boolean(identity) && (options.enabled ?? true),
    queryFn: () => fetchQutilBalance(identity),
  })
}
