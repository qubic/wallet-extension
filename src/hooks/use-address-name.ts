import { useMemo } from 'react'
import { useSmartContracts, useAddressLabels } from '@/lib/qubic-static'
import { getCachedAccounts, getWatchOnlyAccounts } from '@/lib/accounts'

export type AddressNameResult = {
  name: string
  type: 'account' | 'smartContract' | 'namedAddress'
}

export const useAddressName = (address: string): AddressNameResult | undefined => {
  const { data: smartContracts } = useSmartContracts()
  const { data: addressLabels } = useAddressLabels()

  return useMemo(() => {
    if (!address) return undefined

    const allAccounts = [...getCachedAccounts(), ...getWatchOnlyAccounts()]
    const ownAccount = allAccounts.find((a) => a.identity === address)
    if (ownAccount) {
      return { name: ownAccount.name, type: 'account' }
    }

    const sc = smartContracts?.find((c) => c.address === address)
    if (sc) {
      return { name: sc.name, type: 'smartContract' }
    }

    const label = addressLabels?.find((l) => l.address === address)
    if (label) {
      return { name: label.label, type: 'namedAddress' }
    }

    return undefined
  }, [address, smartContracts, addressLabels])
}
