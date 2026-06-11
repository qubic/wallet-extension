import { useQuery } from '@tanstack/react-query'
import { fetchQutilBalanceValue } from '@/lib/qutil-balances'

/**
 * Fetches one identity's QU balance via the QUTIL GetBalances16 procedure and returns
 * it in the same shape as the SDK's LiveBalance. Only `balance` is real; the other
 * fields are unused by the UI and defaulted to 0n. Exported so the Manage Accounts
 * list (useQueries) can reuse it.
 */
export const fetchQutilBalance = async (identity: string) => {
  const balance = await fetchQutilBalanceValue(identity)
  return {
    id: identity,
    balance,
    validForTick: 0n,
    latestIncomingTransferTick: 0n,
    latestOutgoingTransferTick: 0n,
    incomingAmount: 0n,
    outgoingAmount: 0n,
    numberOfIncomingTransfers: 0n,
    numberOfOutgoingTransfers: 0n,
  }
}

type UseQutilBalanceOptions = {
  enabled?: boolean
  refetchInterval?: number
}

/** Drop-in replacement for `useBalance(identity, options)`. */
export const useQutilBalance = (identity: string, options: UseQutilBalanceOptions = {}) => {
  return useQuery({
    ...options,
    queryKey: ['qubic', 'balance', identity],
    enabled: Boolean(identity) && (options.enabled ?? true),
    queryFn: () => fetchQutilBalance(identity),
  })
}
