import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, CopyIcon, Loader2Icon, PackageIcon } from 'lucide-react'
import TransferRightsButton from '@/components/transfer-rights-button'
import { useCurrentIdentity } from '@/hooks/use-current-identity'
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'
import { formatAssetUnits, getAssetsPerContract, useOwnedAssets } from '@/lib/assets'
import { useSmartContracts } from '@/lib/qubic-static'
import { compareBigIntDesc, truncateString } from '@/lib/utils'
import { HIDDEN_BALANCE, useBalanceVisibility } from '@/lib/balance-visibility'

type ContractBreakdown = {
  contractIndex: number
  contractName: string
  numberOfUnits: string
}

const AssetDetail = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { assetKey } = useParams<{ assetKey: string }>()
  const decodedAssetKey = assetKey ? decodeURIComponent(assetKey) : ''
  const identity = useCurrentIdentity()
  const ownedAssets = useOwnedAssets(identity)
  const smartContracts = useSmartContracts()
  const { copyText } = useClipboardCopy()
  const { isVisible } = useBalanceVisibility()

  const contractsMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const sc of smartContracts.data ?? []) {
      map.set(sc.contractIndex, sc.name)
    }
    return map
  }, [smartContracts.data])

  const { asset, contracts } = useMemo(() => {
    if (!ownedAssets.data || !decodedAssetKey) {
      return { asset: null, contracts: [] }
    }

    const perContract = getAssetsPerContract(ownedAssets.data)
    const matching = perContract.filter(
      (entry) => `${entry.issuerIdentity}-${entry.name}` === decodedAssetKey,
    )

    if (matching.length === 0) {
      return { asset: null, contracts: [] }
    }

    const first = matching[0]
    const totalUnits = matching.reduce((sum, c) => sum + BigInt(c.numberOfUnits), 0n).toString()

    const breakdown: ContractBreakdown[] = matching
      .map((entry) => ({
        contractIndex: entry.managingContractIndex,
        contractName:
          contractsMap.get(entry.managingContractIndex) ??
          t('assetDetail.unknownContract', {
            index: entry.managingContractIndex,
          }),
        numberOfUnits: entry.numberOfUnits,
      }))
      .sort((a, b) => compareBigIntDesc(a.numberOfUnits, b.numberOfUnits))

    return {
      asset: {
        name: first.name,
        issuerIdentity: first.issuerIdentity,
        decimals: first.decimals,
        totalUnits,
      },
      contracts: breakdown,
    }
  }, [ownedAssets.data, decodedAssetKey, contractsMap, t])

  const isLoading = ownedAssets.isLoading || smartContracts.isLoading
  const isError = ownedAssets.isError || smartContracts.isError

  const handleCopyIssuer = async () => {
    if (!asset?.issuerIdentity) return
    await copyText(asset.issuerIdentity, {
      messages: {
        successTitle: t('assetDetail.issuerCopied'),
        errorTitle: t('assetDetail.copyFailed'),
      },
    })
  }

  if (isLoading) {
    return (
      <section className="flex w-full justify-center pt-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-6 px-6 pt-12">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    )
  }

  if (!asset) {
    return (
      <section className="flex w-full justify-center pt-4">
        <div className="flex w-full max-w-sm flex-col gap-6 px-6">
          <div className="relative flex items-center justify-center py-3">
            <button
              type="button"
              className="absolute left-0 cursor-pointer p-1 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">{t('assetDetail.title')}</h2>
          </div>
          {isError && <div className="text-xs text-destructive">{t('assetDetail.error')}</div>}
          {!isError && (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-transparent px-3 py-3 text-xs text-muted-foreground">
              <PackageIcon className="h-4 w-4" />
              <span>{t('assetDetail.notFound')}</span>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-6 pb-6">
        {/* Header */}
        <div className="relative flex items-center justify-center py-3">
          <button
            type="button"
            className="absolute left-0 cursor-pointer p-1 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">{t('assetDetail.title')}</h2>
        </div>

        {/* Asset summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">{asset.name.slice(0, 3)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold text-foreground">{asset.name}</div>
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {isVisible ? formatAssetUnits(asset.totalUnits, asset.decimals) : HIDDEN_BALANCE}
              </div>
            </div>
          </div>

          {/* Issuer identity */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">
              {t('assetDetail.issuer')}
            </div>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border/40 bg-card/50 px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-card"
              onClick={handleCopyIssuer}
            >
              <span className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">
                {truncateString(asset.issuerIdentity, {
                  leading: 10,
                  trailing: 10,
                  minLength: 24,
                })}
              </span>
              <CopyIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Managing contracts breakdown */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('assetDetail.managingContracts')}
          </div>

          {contracts.length === 0 && (
            <div className="text-xs text-muted-foreground">{t('assetDetail.noContracts')}</div>
          )}

          <div className="space-y-2">
            {contracts.map((contract) => (
              <div
                key={contract.contractIndex}
                className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/50 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-card"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{contract.contractName}</div>
                  <div className="text-xs text-muted-foreground">
                    {isVisible
                      ? `${formatAssetUnits(contract.numberOfUnits, asset.decimals)} ${asset.name}`
                      : HIDDEN_BALANCE}
                  </div>
                </div>
                <TransferRightsButton
                  className="ml-2"
                  onClick={() =>
                    navigate(
                      `/transfer/manage-rights?asset=${encodeURIComponent(decodedAssetKey)}&contractIndex=${contract.contractIndex}`,
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AssetDetail
