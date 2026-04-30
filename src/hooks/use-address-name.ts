import { useMemo } from 'react'
import { useSmartContracts, useAddressLabels, useExchanges } from '@/lib/qubic-static'
import { useAssetIssuances } from '@/lib/assets'
import { useAccountNames } from '@/hooks/use-account-names'
import { EMPTY_ADDRESS } from '@/lib/config/constants'

export type AddressNameResult = {
  name: string
  type: 'account' | 'smartContract' | 'exchange' | 'token' | 'namedAddress'
}

export const useAddressName = (address: string): AddressNameResult | undefined => {
  const { data: smartContracts } = useSmartContracts()
  const { data: exchanges } = useExchanges()
  const { data: assetIssuances } = useAssetIssuances()
  const { data: addressLabels } = useAddressLabels()
  const allAccounts = useAccountNames()

  return useMemo(() => {
    if (!address) return undefined

    const ownAccount = allAccounts.find((a) => a.identity === address)
    if (ownAccount) {
      return { name: ownAccount.name, type: 'account' }
    }

    const sc = smartContracts?.find((c) => c.address === address)
    if (sc) {
      return { name: sc.name, type: 'smartContract' }
    }

    const exchange = exchanges?.find((e) => e.address === address)
    if (exchange) {
      return { name: exchange.name, type: 'exchange' }
    }

    if (assetIssuances?.assets) {
      const issuance = assetIssuances.assets.find(
        (asset) =>
          asset.data.issuerIdentity === address && asset.data.issuerIdentity !== EMPTY_ADDRESS,
      )
      if (issuance) {
        return { name: issuance.data.name, type: 'token' }
      }
    }

    const label = addressLabels?.find((l) => l.address === address)
    if (label) {
      return { name: label.label, type: 'namedAddress' }
    }

    return undefined
  }, [address, allAccounts, smartContracts, exchanges, assetIssuances, addressLabels])
}
