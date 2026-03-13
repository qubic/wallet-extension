import { useEffect, useState } from 'react'
import { ChevronRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useBalance } from '@qubic-labs/react'
import {
  type AggregatedAsset,
  aggregateAssets,
  formatAssetUnits,
  useOwnedAssets,
} from '@/lib/assets'
import { getCurrentIdentity } from '@/lib/accounts'
import { NATIVE_TOKEN_NAME, NATIVE_TOKEN_SYMBOL } from '@/lib/config/constants'
import { formatBalance, normalizeBalance } from '@/lib/utils'

const SelectToken = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [currentIdentity, setCurrentIdentity] = useState(getCurrentIdentity())
  const balance = useBalance(currentIdentity)
  const ownedAssets = useOwnedAssets(currentIdentity)
  const parsedAssets = aggregateAssets(ownedAssets.data ?? {}, true)
  const onChainQuBalance = normalizeBalance(balance.data?.balance)

  useEffect(() => {
    const refreshAccount = () => {
      setCurrentIdentity(getCurrentIdentity())
    }
    window.addEventListener('storage', refreshAccount)
    window.addEventListener('wallet-account-updated', refreshAccount)
    return () => {
      window.removeEventListener('storage', refreshAccount)
      window.removeEventListener('wallet-account-updated', refreshAccount)
    }
  }, [])

  const handleSelectQu = () => {
    navigate('/transfer/send?token=qu')
  }

  const handleSelectAsset = (asset: AggregatedAsset) => {
    const tokenKey = `${asset.issuerIdentity}-${asset.name}`
    navigate(`/transfer/send?token=${encodeURIComponent(tokenKey)}`)
  }

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-4 px-4 pb-2">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('transfer.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('transfer.selectToken.subtitle')}</p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card"
            onClick={handleSelectQu}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">{NATIVE_TOKEN_SYMBOL}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground">{NATIVE_TOKEN_NAME}</div>
              <div className="text-xs text-muted-foreground">
                {balance.isLoading
                  ? t('transfer.balance.loading')
                  : `${formatBalance(onChainQuBalance)} ${NATIVE_TOKEN_SYMBOL}`}
              </div>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>

          {parsedAssets.map((asset) => (
            <button
              key={`${asset.issuerIdentity}-${asset.name}`}
              type="button"
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card"
              onClick={() => handleSelectAsset(asset)}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-xs font-bold text-primary">{asset.name.slice(0, 3)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">{asset.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatAssetUnits(asset.numberOfUnits, asset.decimals)} {asset.name}
                </div>
              </div>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}

          {!ownedAssets.isLoading && parsedAssets.length === 0 && (
            <div className="py-2 text-center text-xs text-muted-foreground">
              {t('home.assets.empty')}
            </div>
          )}

          {ownedAssets.isLoading && (
            <div className="py-2 text-center text-xs text-muted-foreground">
              {t('home.assets.loading')}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default SelectToken
