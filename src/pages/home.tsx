import { useBalance, useTransactions } from '@qubic-labs/react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CopyIcon,
  RefreshCwIcon,
  SendIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

const formatQus = (value: bigint) => {
  const formatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2,
  })
  return formatter.format(Number(value))
}

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

const formatIdentity = (identity: string) => {
  if (identity.length <= 12) return identity
  return `${identity.slice(0, 6)}…${identity.slice(-6)}`
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

const normalizeBalance = (value: bigint | number | string | undefined) => {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(Math.floor(value))
  if (typeof value === 'string') return BigInt(value)
  return 0n
}

const BalanceCard = ({ balance }: { balance: ReturnType<typeof useBalance> }) => {
  if (balance.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  if (balance.error) {
    return <div className="text-sm text-destructive">{balance.error.message}</div>
  }

  const normalized = normalizeBalance(balance.data?.balance)

  return (
    <div className="text-center">
      <div className="text-4xl font-semibold text-foreground">{formatQus(normalized)}</div>
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
  if (transactions.isLoading) {
    return <div className="text-xs text-muted-foreground">Loading recent activity...</div>
  }

  if (transactions.error) {
    return <div className="text-xs text-destructive">{transactions.error.message}</div>
  }

  const items = transactions.data?.pages.flatMap((page) => page.transactions) ?? []
  const recent = items.slice(0, 3)

  if (recent.length === 0) {
    return <div className="text-xs text-muted-foreground">No recent transactions.</div>
  }

  return (
    <div className="w-full space-y-2 text-left">
      {recent.map((tx) => {
        const isIncoming = tx.destination === identity
        const label = isIncoming ? 'Incoming' : 'Outgoing'
        const counterparty = isIncoming ? tx.source : tx.destination
        const Icon = isIncoming ? ArrowDownLeftIcon : ArrowUpRightIcon

        return (
          <div key={tx.hash} className="flex items-center justify-between bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                  isIncoming
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-[#ff6b6b]/40 bg-[#ff6b6b]/10 text-[#ff6b6b]'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {formatIdentity(counterparty)}
                </span>
                <span className="text-[11px] text-muted-foreground/70">Tick {tx.tickNumber}</span>
              </div>
            </div>
            <span
              className={`text-sm font-medium ${isIncoming ? 'text-primary' : 'text-[#ff6b6b]'}`}
            >
              {isIncoming ? '+' : '-'}
              {formatQus(tx.amount)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const Home = () => {
  const identity = localStorage.getItem('currentIdentity') ?? '...'
  const pathname = globalThis.location?.pathname ?? ''
  const isSidePanel = pathname.endsWith('sidepanel.html')
  const isPopup = pathname.endsWith('popup.html')
  const navigate = useNavigate()
  const balance = useBalance(identity, { refetchInterval: 10_000 })
  const latestStats = useQuery({
    queryKey: ['qubic', 'latest-stats'],
    queryFn: fetchLatestStats,
    staleTime: 120_000,
    gcTime: 120_000,
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
      toast.success('Address copied', {
        description: 'Your public identity is now in the clipboard.',
      })
    } catch {
      toast.error('Copy failed', {
        description: 'Please try again or copy manually.',
      })
    }
  }

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
    <section className="flex min-h-full w-full justify-center pb-6 pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Balance</span>
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
        <div className="bg-muted/10 p-4 text-center">
          <BalanceCard balance={balance} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="aspect-square w-full flex-row gap-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
            onClick={() => navigate('/transfer')}
          >
            <SendIcon className="h-6 w-6" />
            Send
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="aspect-square w-full flex-row gap-2 rounded-md bg-muted/20 hover:bg-muted/30"
            onClick={() => setIsReceiveOpen(true)}
          >
            <ArrowDownLeftIcon className="h-6 w-6" />
            Receive
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Recent activity
          </div>
          <TransactionsPreview identity={identity} transactions={transactions} />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Network
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-muted/10 px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Tick
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.currentTick ?? '--'}
              </div>
            </div>
            <div className="bg-muted/10 px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Epoch
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.epoch ?? '--'}
              </div>
            </div>
            <div className="bg-muted/10 px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Supply
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.circulatingSupply
                  ? formatQus(BigInt(latestStats.data.data.circulatingSupply))
                  : '--'}
              </div>
            </div>
            <div className="bg-muted/10 px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Active
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.activeAddresses ?? '--'}
              </div>
            </div>
            <div className="bg-muted/10 px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Price / B
              </div>
              <div className="text-sm font-semibold text-foreground">
                {latestStats.data?.data?.price
                  ? `$${(latestStats.data.data.price * 1_000_000_000).toFixed(2)}`
                  : '--'}
              </div>
            </div>
            <div className="bg-muted/10 px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                MCap
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
            Assets
          </div>
          <div className="flex items-center justify-between bg-muted/20 px-3 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">QUBIC</span>
              <span className="text-xs text-muted-foreground">QUS</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {balance.data?.balance ? formatQus(normalizeBalance(balance.data.balance)) : '--'}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Other assets coming soon.</div>
        </div>
      </div>

      <Drawer open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DrawerContent
          className={`max-h-[100vh] border-none bg-background px-6 pt-0 ${
            isSidePanel ? 'pb-8' : isPopup ? 'pb-24' : 'pb-20'
          }`}
        >
          <DrawerHeader className="space-y-2 text-left">
            <DrawerTitle>Receive Qubic</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Share this QR code or copy your public identity address.
            </p>
          </DrawerHeader>
          <div className="mt-4 flex flex-col items-center gap-4 text-center">
            <div className="flex h-52 w-52 items-center justify-center bg-muted/20">
              {qrCode ? (
                <img src={qrCode} alt="Public identity QR code" className="h-48 w-48" />
              ) : (
                <div className="text-xs text-muted-foreground">Generating QR code...</div>
              )}
            </div>
            <div className="w-full space-y-2">
              <div className="break-all rounded-md bg-muted/20 p-3 text-xs text-foreground">
                {identity}
              </div>
              <Button size="lg" className="w-full" onClick={handleCopyIdentity}>
                <CopyIcon className="h-5 w-5" />
                Copy address
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  )
}

export default Home
