import { useBalance, useTransactions } from '@qubic-labs/react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CopyIcon,
  InboxIcon,
  PackageIcon,
  DownloadIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useTranslation } from 'react-i18next'
import { normalizeBalance, formatBalanceCompact, truncateString } from '@/lib/utils'

const formatUsd = (value: bigint) => {
  const usdPerBillion = 435
  const billions = Number(value) / 1_000_000_000
  const usdValue = billions * usdPerBillion
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(usdValue)
}

type OwnedAssetsResponse = {
  ownedAssets?: Array<{
    data?: {
      numberOfUnits?: string
      issuedAsset?: {
        name?: string
        numberOfDecimalPlaces?: number
        unitOfMeasurement?: number[]
        type?: number
        issuerIdentity?: string
      }
    }
  }>
}

const fetchOwnedAssets = async (identity: string): Promise<OwnedAssetsResponse> => {
  const response = await fetch(`https://rpc.qubic.org/live/v1/assets/${identity}/owned`, {
    headers: { accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to load assets.')
  }
  return response.json() as Promise<OwnedAssetsResponse>
}

const formatAssetUnits = (units: string | undefined, decimals = 0) => {
  if (!units) return '--'
  if (decimals <= 0) return Number(units).toLocaleString()
  const padded = units.padStart(decimals + 1, '0')
  const whole = padded.slice(0, -decimals)
  const fraction = padded.slice(-decimals).replace(/0+$/, '')
  return `${Number(whole).toLocaleString()}${fraction ? `.${fraction}` : ''}`
}

type LatestStatsResponse = {
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

const fetchLatestStats = async (): Promise<LatestStatsResponse> => {
  const response = await fetch('https://rpc.qubic.org/v1/latest-stats')
  if (!response.ok) {
    throw new Error('Failed to load network stats.')
  }
  return response.json() as Promise<LatestStatsResponse>
}

const BalanceCard = ({ balance }: { balance: ReturnType<typeof useBalance> }) => {
  const { t } = useTranslation()
  if (balance.isLoading) {
    return <div className="text-sm text-muted-foreground">{t('home.balance.loading')}</div>
  }

  if (balance.error) {
    return <div className="text-sm text-destructive">{balance.error.message}</div>
  }

  const normalized = normalizeBalance(balance.data?.balance)

  return (
    <div className="text-center">
      <div className="text-4xl font-semibold text-foreground">
        {formatBalanceCompact(normalized)}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{formatUsd(normalized)}</div>
    </div>
  )
}

const TransactionsPreview = ({
  identity,
  transactions,
}: {
  identity: string
  transactions: ReturnType<typeof useTransactions>
}) => {
  const { t } = useTranslation()
  if (transactions.isLoading) {
    return <div className="text-xs text-muted-foreground">{t('home.recent.loading')}</div>
  }

  if (transactions.error) {
    return <div className="text-xs text-destructive">{transactions.error.message}</div>
  }

  const items = transactions.data?.pages.flatMap((page) => page.transactions) ?? []
  const recent = items.slice(0, 3)

  if (recent.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
          <InboxIcon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{t('home.recent.emptyTitle')}</div>
          <div className="text-xs text-muted-foreground">{t('home.recent.empty')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2 text-left">
      {recent.map((tx) => {
        const isIncoming = tx.destination === identity
        const label = isIncoming ? t('home.recent.incoming') : t('home.recent.outgoing')
        const counterparty = isIncoming ? tx.source : tx.destination
        const Icon = isIncoming ? ArrowDownLeftIcon : ArrowUpRightIcon

        return (
          <div
            key={tx.hash}
            className="flex items-center justify-between rounded-lg bg-card px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                  isIncoming
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-[var(--destructive)]/40 bg-[var(--destructive)]/10 text-[var(--destructive)]'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {truncateString(counterparty)}
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                  {t('home.recent.tick', { tick: tx.tickNumber })}
                </span>
              </div>
            </div>
            <span
              className={`text-sm font-medium ${isIncoming ? 'text-primary' : 'text-[var(--destructive)]'}`}
            >
              {isIncoming ? '+' : '-'}
              {formatBalanceCompact(tx.amount)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const Home = () => {
  const { t } = useTranslation()
  const [identity, setIdentity] = useState(localStorage.getItem('currentIdentity') ?? '')
  const pathname = globalThis.location?.pathname ?? ''
  const isSidePanel = pathname.endsWith('sidepanel.html')
  const isPopup = pathname.endsWith('popup.html')
  const isConstrainedLayout = isPopup || isSidePanel
  const assetsListMaxHeightClass = isPopup ? 'max-h-36' : isSidePanel ? 'max-h-44' : 'max-h-52'
  const navigate = useNavigate()
  const balance = useBalance(identity, { refetchInterval: 10_000 })
  const latestStats = useQuery({
    queryKey: ['qubic', 'latest-stats'],
    queryFn: fetchLatestStats,
    staleTime: 120_000,
    gcTime: 120_000,
  })
  const ownedAssets = useQuery({
    queryKey: ['qubic', 'owned-assets', identity],
    queryFn: () => fetchOwnedAssets(identity),
    enabled: Boolean(identity),
    staleTime: 60_000,
    gcTime: 60_000,
  })
  const transactions = useTransactions(
    {
      identity,
      pageSize: 5,
      limit: 5,
    },
    { refetchInterval: 15_000 },
  )
  const [isReceiveOpen, setIsReceiveOpen] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)

  const handleRefresh = () => {
    void balance.refetch()
    void transactions.refetch()
  }

  const handleCopyIdentity = async () => {
    try {
      await navigator.clipboard.writeText(identity)
      toast.success(t('home.toast.copySuccess'), {
        description: t('home.toast.copySuccessDesc'),
      })
    } catch {
      toast.error(t('home.toast.copyFail'), {
        description: t('home.toast.copyFailDesc'),
      })
    }
  }

  useEffect(() => {
    const refreshIdentity = () => {
      setIdentity(localStorage.getItem('currentIdentity') ?? '')
    }

    refreshIdentity()
    window.addEventListener('storage', refreshIdentity)
    return () => window.removeEventListener('storage', refreshIdentity)
  }, [])

  useEffect(() => {
    let isActive = true

    if (!isReceiveOpen || !identity) {
      setQrCode(null)
      return undefined
    }

    QRCode.toDataURL(identity, { width: 240, margin: 1 })
      .then((url: string) => {
        if (isActive) {
          setQrCode(url)
        }
      })
      .catch(() => {
        if (isActive) {
          setQrCode(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [identity, isReceiveOpen])

  return (
    <section
      className={`flex min-h-full w-full pb-6 pt-4 ${isConstrainedLayout ? 'justify-start' : 'justify-center'}`}
    >
      <div className="flex w-full max-w-sm flex-col gap-6 px-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            {t('home.balance.label')}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            aria-label="Refresh"
            onClick={handleRefresh}
            disabled={balance.isFetching || transactions.isFetching}
          >
            <RefreshCwIcon
              className={`h-4 w-4 ${
                balance.isFetching || transactions.isFetching ? 'animate-spin' : ''
              }`}
            />
          </Button>
        </div>
        <div className="rounded-lg bg-card p-4 text-center">
          <BalanceCard balance={balance} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="aspect-square w-full flex-row gap-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
            onClick={() => navigate('/transfer')}
          >
            <ArrowUpRightIcon className="h-6 w-6" />
            {t('home.actions.send')}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="aspect-square w-full flex-row gap-2 rounded-md bg-card hover:bg-muted"
            onClick={() => setIsReceiveOpen(true)}
          >
            <DownloadIcon className="h-6 w-6" />
            {t('home.actions.receive')}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('home.recent.title')}
          </div>
          <TransactionsPreview identity={identity} transactions={transactions} />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('home.network.title')}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-card px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {t('home.network.tick')}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.currentTick ?? '--'}
              </div>
            </div>
            <div className="rounded-lg bg-card px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {t('home.network.epoch')}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.epoch ?? '--'}
              </div>
            </div>
            <div className="rounded-lg bg-card px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {t('home.network.supply')}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.circulatingSupply
                  ? formatBalanceCompact(BigInt(latestStats.data.data.circulatingSupply))
                  : '--'}
              </div>
            </div>
            <div className="rounded-lg bg-card px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {t('home.network.active')}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.activeAddresses ?? '--'}
              </div>
            </div>
            <div className="rounded-lg bg-card px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {t('home.network.pricePerB')}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.price
                  ? `$${(latestStats.data.data.price * 1_000_000_000).toFixed(2)}`
                  : '--'}
              </div>
            </div>
            <div className="rounded-lg bg-card px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {t('home.network.marketCap')}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.marketCap
                  ? `$${Number(latestStats.data.data.marketCap).toLocaleString()}`
                  : '--'}
              </div>
            </div>
          </div>
          {latestStats.error && (
            <div className="text-xs text-destructive">{latestStats.error.message}</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('home.assets.title')}
          </div>
          {ownedAssets.isLoading && (
            <div className="text-xs text-muted-foreground">{t('home.assets.loading')}</div>
          )}
          {ownedAssets.error && (
            <div className="text-xs text-destructive">{t('home.assets.error')}</div>
          )}
          {ownedAssets.data?.ownedAssets && ownedAssets.data.ownedAssets.length > 0 && (
            <div
              className={`app-scrollbar ${assetsListMaxHeightClass} space-y-2 overflow-y-auto pr-1`}
            >
              {ownedAssets.data.ownedAssets.map((asset) => {
                const info = asset.data
                const issued = info?.issuedAsset
                const name = issued?.name ?? t('home.assets.unknown')
                const decimals = issued?.numberOfDecimalPlaces ?? 0
                const key = [
                  issued?.issuerIdentity ?? 'unknown',
                  issued?.name ?? 'asset',
                  issued?.type ?? 0,
                  info?.numberOfUnits ?? '0',
                ].join('-')
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-muted/20 px-3 py-2"
                  >
                    <div className="min-w-0 flex flex-col">
                      <span className="truncate text-sm font-semibold text-foreground">{name}</span>
                      {issued?.issuerIdentity && (
                        <span className="truncate text-xs text-muted-foreground">
                          {truncateString(issued.issuerIdentity)}
                        </span>
                      )}
                    </div>
                    <div className="ml-3 shrink-0 text-sm font-semibold text-foreground">
                      {formatAssetUnits(info?.numberOfUnits, decimals)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {ownedAssets.isSuccess &&
            (!ownedAssets.data?.ownedAssets || ownedAssets.data.ownedAssets.length === 0) && (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                  <PackageIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t('home.assets.emptyTitle')}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('home.assets.empty')}</div>
                </div>
              </div>
            )}
        </div>
      </div>

      <Drawer open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DrawerContent
          className={`max-h-[100vh] border-none bg-background px-6 pt-0 ${
            isSidePanel ? 'pb-8' : isPopup ? 'pb-24' : 'pb-20'
          }`}
        >
          <DrawerHeader className="space-y-2 text-left">
            <DrawerTitle>{t('home.receive.title')}</DrawerTitle>
            <p className="text-sm text-muted-foreground">{t('home.receive.description')}</p>
          </DrawerHeader>
          <div className="mt-4 flex flex-col items-center gap-4 text-center">
            <div className="flex h-52 w-52 items-center justify-center rounded-lg bg-card">
              {qrCode ? (
                <img src={qrCode} alt="Public identity QR code" className="h-48 w-48" />
              ) : (
                <div className="text-xs text-muted-foreground">{t('home.receive.generating')}</div>
              )}
            </div>
            <div className="w-full space-y-2">
              <div className="break-all rounded-md bg-card p-3 text-xs text-foreground">
                {identity}
              </div>
              <Button size="lg" className="w-full" onClick={handleCopyIdentity}>
                <CopyIcon className="h-5 w-5" />
                {t('home.receive.copy')}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  )
}

export default Home
