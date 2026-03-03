import { useMemo } from 'react'
import { useSmartContracts, useAddressLabels, useExchanges, useTokens } from '@/lib/qubic-static'
import { getCachedAccounts, getWatchOnlyAccounts } from '@/lib/accounts'

export type AddressNameResult = {
  name: string
  type: 'account' | 'smartContract' | 'exchange' | 'token' | 'namedAddress'
}

export const useAddressName = (address: string): AddressNameResult | undefined => {
  const { data: smartContracts } = useSmartContracts()
  const { data: exchanges } = useExchanges()
  const { data: tokens } = useTokens()
  const { data: addressLabels } = useAddressLabels()

  return useMemo(() => {
    if (!address) return undefined

    // 1. Account — match against user's wallet accounts
    const allAccounts = [...getCachedAccounts(), ...getWatchOnlyAccounts()]
    const ownAccount = allAccounts.find((a) => a.identity === address)
    if (ownAccount) {
      return { name: ownAccount.name, type: 'account' }
    }

    // 2. Smart Contract — match against known smart contracts
    const sc = smartContracts?.find((c) => c.address === address)
    if (sc) {
      return { name: sc.name, type: 'smartContract' }
    }

    // 3. Exchange — match against known exchange addresses
    const exchange = exchanges?.find((e) => e.address === address)
    if (exchange) {
      return { name: exchange.name, type: 'exchange' }
    }

    // 4. Token — match against token issuer addresses
    const token = tokens?.find((t) => t.issuer === address)
    if (token) {
      return { name: token.name, type: 'token' }
    }

    // 5. Address Label — match against labeled addresses
    const label = addressLabels?.find((l) => l.address === address)
    if (label) {
      return { name: label.label, type: 'namedAddress' }
    }

    return undefined
  }, [address, smartContracts, exchanges, tokens, addressLabels])
}
