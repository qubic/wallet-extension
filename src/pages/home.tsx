import { useBalance, useTransactions } from '@qubic-labs/react'
import { CopyIcon, EyeIcon, InboxIcon, Loader2Icon, PackageIcon, RefreshCwIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ReceiveIcon } from '@/components/icons/receive-icon'
import { SendIcon } from '@/components/icons/send-icon'
import { useTranslation } from 'react-i18next'
import { normalizeBalance, formatBalanceCompact, truncateString } from '@/lib/utils'
import { getCurrentIdentity, isWatchOnlyIdentity } from '@/lib/accounts'
import { aggregateAssets, formatAssetUnits, useOwnedAssets } from '@/lib/assets'
import { useLatestStats } from '@/lib/network-stats'
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'
import {
  getPendingOutgoingDebit,
  PENDING_SETTLED_EVENT,
  getPendingTransactionsForIdentity,
  isTransactionPending,
  resolvePendingTransactions,
  usePendingTransactionsVersion,
} from '@/lib/pending-transactions'

const formatUsdFromNumber = (value: number) => {
  const usdPerBillion = 435
  const billions = value / 1_000_000_000
  const usdValue = billions * usdPerBillion
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(usdValue)
}

const getCachedBalance = (identity: string): bigint | null => {
  if (!identity) return null
  try {
    const raw = localStorage.getItem(`wallet:balance:${identity}`)
    if (!raw) return null
    return BigInt(raw)
  } catch {
    return null
  }
}

const setCachedBalance = (identity: string, value: bigint) => {
  if (!identity) return
  try {
    localStorage.setItem(`wallet:balance:${identity}`, value.toString())
  } catch {
    // ignore cache failures
  }
}

const SYNC_BADGE_SHOW_DELAY_MS = 180
const SYNC_BADGE_MIN_VISIBLE_MS = 700

const pageMotion = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.05,
    },
  },
}

const sectionMotion = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28 },
  },
}

const BalanceCard = ({
  balance,
  identity,
  pendingDebit,
  networkMeta,
}: {
  balance: ReturnType<typeof useBalance>
  identity: string
  pendingDebit: bigint
  networkMeta: {
    tick: string | number
    epoch: string | number
    price: string
  }
}) => {
  const { t } = useTranslation()
  const [cachedBalance, setCachedBalanceState] = useState<bigint | null>(() =>
    getCachedBalance(identity),
  )
  const normalized = normalizeBalance(balance.data?.balance ?? cachedBalance ?? 0n)
  const numericBalance = Number(normalized)
  const [displayBalance, setDisplayBalance] = useState(0)
  const displayRef = useRef(0)

  useEffect(() => {
    setCachedBalanceState(getCachedBalance(identity))
  }, [identity])

  useEffect(() => {
    if (balance.data?.balance === undefined) return
    setCachedBalance(identity, balance.data.balance)
    setCachedBalanceState(balance.data.balance)
  }, [balance.data?.balance, identity])

  useEffect(() => {
    if (!Number.isFinite(numericBalance)) return undefined
    const from = displayRef.current
    const to = numericBalance
    const duration = 750
    const start = performance.now()
    let frame = 0

    const easeOutCubic = (x: number) => 1 - (1 - x) ** 3
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = easeOutCubic(progress)
      const nextValue = from + (to - from) * eased
      displayRef.current = nextValue
      setDisplayBalance(nextValue)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [numericBalance])

  if (balance.isLoading && cachedBalance == null) {
    return <div className="text-sm text-muted-foreground">{t('home.balance.loading')}</div>
  }

  if (balance.error) {
    return <div className="text-sm text-destructive">{balance.error.message}</div>
  }

  const effectiveBalance = normalized > pendingDebit ? normalized - pendingDebit : 0n
  const pendingActive = pendingDebit > 0n
  const displayBigInt = BigInt(Math.max(0, Math.floor(displayBalance)))
  const displayValue =
    pendingActive && displayBigInt > pendingDebit ? displayBigInt - pendingDebit : effectiveBalance

  return (
    <div className="space-y-3 text-center">
      <div className="text-5xl font-semibold leading-none tracking-tight text-foreground">
        {formatBalanceCompact(displayValue)}
      </div>
      <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
        {`≈ ${formatUsdFromNumber(Number(displayValue))}`}
      </div>
      <div className="text-[11px] text-muted-foreground">
        {networkMeta.price} / {networkMeta.tick} / {networkMeta.epoch}
      </div>
      {pendingActive && (
        <div className="text-[11px] text-amber-700 dark:text-amber-300">
          -{formatBalanceCompact(pendingDebit)} {t('home.status.pending').toLowerCase()}
        </div>
      )}
    </div>
  )
}

const TransactionsPreview = ({
  identity,
  transactions,
  currentTick,
  onViewMore,
  onOpenTx,
}: {
  identity: string
  transactions: ReturnType<typeof useTransactions>
  currentTick?: number
  onViewMore: () => void
  onOpenTx: (hash: string) => void
}) => {
  const { t } = useTranslation()
  usePendingTransactionsVersion()
  if (transactions.isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-16 animate-pulse rounded-xl border border-border/40 bg-muted/20" />
        <div className="h-16 animate-pulse rounded-xl border border-border/40 bg-muted/20" />
        <div className="h-16 animate-pulse rounded-xl border border-border/40 bg-muted/20" />
      </div>
    )
  }

  if (transactions.error) {
    return <div className="text-xs text-destructive">{transactions.error.message}</div>
  }

  const items = transactions.data?.pages.flatMap((page) => page.transactions) ?? []
  const pending = getPendingTransactionsForIdentity(identity, currentTick)
  const pendingHashes = new Set(pending.map((tx) => tx.hash.toLowerCase()))
  const pendingItems = pending.map((tx) => ({
    hash: tx.hash,
    source: tx.sourceIdentity,
    destination: tx.destinationIdentity ?? '',
    amount: tx.amount ?? 0n,
    tickNumber: tx.targetTick,
    inputType: tx.inputType ?? 0,
    timestamp: BigInt(tx.createdAt),
  }))
  const merged = [
    ...pendingItems,
    ...items.filter((tx) => !pendingHashes.has(tx.hash.toLowerCase())),
  ]
  const recent = merged.slice(0, 3)

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
        const isSimpleTransfer = Number(tx.inputType) === 0
        const label = isSimpleTransfer
          ? isIncoming
            ? t('history.received')
            : t('history.sent')
          : isIncoming
            ? t('history.incoming')
            : t('history.outgoing')
        const counterparty = isIncoming ? tx.source : tx.destination
        const counterpartyLabel = isSimpleTransfer
          ? isIncoming
            ? t('history.from', { address: truncateString(counterparty) })
            : t('history.to', { address: truncateString(counterparty) })
          : truncateString(counterparty)
        const Icon = isIncoming ? ReceiveIcon : SendIcon
        const isPending = isTransactionPending(tx.hash, currentTick)

        return (
          <motion.button
            type="button"
            key={tx.hash}
            className={`group flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
              isPending
                ? 'animate-pulse border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                : 'border-border/40 bg-background/40 hover:border-primary/30 hover:bg-background/60'
            }`}
            onClick={() => onOpenTx(tx.hash)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                  isPending
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : isIncoming
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-[var(--destructive)]/40 bg-[var(--destructive)]/10 text-[var(--destructive)]'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">{counterpartyLabel}</span>
                <span className="text-[11px] text-muted-foreground/70">
                  {(() => {
                    const ts = Number(tx.timestamp)
                    if (!ts) return '--'
                    const date = new Date(ts > 1e12 ? ts : ts * 1000)
                    const now = new Date()
                    if (date.toDateString() === now.toDateString()) return t('history.today')
                    const yesterday = new Date(now)
                    yesterday.setDate(yesterday.getDate() - 1)
                    if (date.toDateString() === yesterday.toDateString())
                      return t('history.yesterday')
                    return date.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
                    })
                  })()}
                </span>
              </div>
            </div>
            <span
              className={`text-sm font-semibold ${
                isPending
                  ? 'text-amber-700 dark:text-amber-300'
                  : isIncoming
                    ? 'text-primary'
                    : 'text-[var(--destructive)]'
              }`}
            >
              {isIncoming ? '+' : '-'}
              {formatBalanceCompact(tx.amount)}
            </span>
          </motion.button>
        )
      })}
      <button
        type="button"
        className="w-full cursor-pointer pt-1 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        onClick={onViewMore}
        aria-label={t('home.actions.history')}
      >
        {t('home.recent.viewAll')}
      </button>
    </div>
  )
}

const Home = () => {
  const { t } = useTranslation()
  usePendingTransactionsVersion()
  const [identity, setIdentity] = useState(getCurrentIdentity())
  const [isWatchOnly, setIsWatchOnly] = useState(() => isWatchOnlyIdentity(getCurrentIdentity()))
  const pathname = globalThis.location?.pathname ?? ''
  const isSidePanel = pathname.endsWith('sidepanel.html')
  const isPopup = pathname.endsWith('popup.html')
  const isConstrainedLayout = isPopup || isSidePanel
  const assetsListMaxHeightClass = isPopup ? 'max-h-36' : isSidePanel ? 'max-h-44' : 'max-h-52'
  const navigate = useNavigate()
  const { copyText } = useClipboardCopy()
  const balance = useBalance(identity, { refetchInterval: 15_000 })
  const latestStats = useLatestStats('home')
  const ownedAssets = useOwnedAssets(identity)
  const aggregatedAssets = ownedAssets.data ? aggregateAssets(ownedAssets.data) : []
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
  const [virtualTick, setVirtualTick] = useState<number | null>(null)
  const currentTickFromRpc = latestStats.data?.data?.currentTick
  const hasVirtualTick = virtualTick !== null
  const tickValue = virtualTick ?? currentTickFromRpc ?? '--'
  const currentTick = typeof tickValue === 'number' ? tickValue : undefined
  const pendingOutgoingDebit = getPendingOutgoingDebit(identity, currentTick)
  const hasPendingOutgoing = getPendingTransactionsForIdentity(identity, currentTick).length > 0
  const epochValue = latestStats.data?.data?.epoch ?? '--'
  const pricePerBValue = latestStats.data?.data?.price
    ? `$${(latestStats.data.data.price * 1_000_000_000).toFixed(2)}`
    : '--'
  const handleRefresh = () => {
    void balance.refetch()
    void transactions.refetch()
  }
  const transactionItems = useMemo(
    () => transactions.data?.pages.flatMap((page) => page.transactions) ?? [],
    [transactions.data],
  )
  const isSyncingRaw =
    balance.isFetching ||
    transactions.isFetching ||
    ownedAssets.isFetching ||
    latestStats.isFetching
  const [isSyncingVisible, setIsSyncingVisible] = useState(false)
  const syncingShownAtRef = useRef<number | null>(null)
  const syncShowTimerRef = useRef<number | null>(null)
  const syncHideTimerRef = useRef<number | null>(null)

  const handleCopyIdentity = async () => {
    await copyText(identity, {
      messages: {
        successTitle: t('home.toast.copySuccess'),
        successDescription: t('home.toast.copySuccessDesc'),
        errorTitle: t('home.toast.copyFail'),
        errorDescription: t('home.toast.copyFailDesc'),
      },
    })
  }

  useEffect(() => {
    const refreshIdentity = () => {
      const nextIdentity = getCurrentIdentity()
      setIdentity(nextIdentity)
      setIsWatchOnly(isWatchOnlyIdentity(nextIdentity))
    }

    refreshIdentity()
    window.addEventListener('storage', refreshIdentity)
    window.addEventListener('wallet-account-updated', refreshIdentity)
    return () => {
      window.removeEventListener('storage', refreshIdentity)
      window.removeEventListener('wallet-account-updated', refreshIdentity)
    }
  }, [])

  useEffect(() => {
    resolvePendingTransactions(transactionItems, currentTick)
  }, [transactionItems, currentTick])

  useEffect(() => {
    const clearTimers = () => {
      if (syncShowTimerRef.current) {
        window.clearTimeout(syncShowTimerRef.current)
        syncShowTimerRef.current = null
      }
      if (syncHideTimerRef.current) {
        window.clearTimeout(syncHideTimerRef.current)
        syncHideTimerRef.current = null
      }
    }

    clearTimers()

    if (isSyncingRaw) {
      if (isSyncingVisible) return undefined
      syncShowTimerRef.current = window.setTimeout(() => {
        syncingShownAtRef.current = Date.now()
        setIsSyncingVisible(true)
      }, SYNC_BADGE_SHOW_DELAY_MS)
      return clearTimers
    }

    if (!isSyncingVisible) return undefined

    const elapsed = syncingShownAtRef.current ? Date.now() - syncingShownAtRef.current : 0
    const remaining = Math.max(0, SYNC_BADGE_MIN_VISIBLE_MS - elapsed)
    syncHideTimerRef.current = window.setTimeout(() => {
      syncingShownAtRef.current = null
      setIsSyncingVisible(false)
    }, remaining)

    return clearTimers
  }, [isSyncingRaw, isSyncingVisible])

  useEffect(() => {
    const handlePendingSettled = () => {
      void balance.refetch()
      void transactions.refetch()
      void ownedAssets.refetch()
    }
    window.addEventListener(PENDING_SETTLED_EVENT, handlePendingSettled)
    return () => {
      window.removeEventListener(PENDING_SETTLED_EVENT, handlePendingSettled)
    }
  }, [balance, ownedAssets, transactions])

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

  useEffect(() => {
    if (typeof currentTickFromRpc !== 'number') return
    setVirtualTick(currentTickFromRpc)
  }, [currentTickFromRpc])

  useEffect(() => {
    if (!hasVirtualTick) return
    const timer = window.setInterval(() => {
      setVirtualTick((previous) => (previous == null ? previous : previous + 1))
    }, 1_300)
    return () => {
      window.clearInterval(timer)
    }
  }, [hasVirtualTick])

  return (
    <section
      className={`relative flex w-full pt-4 ${isConstrainedLayout ? 'justify-start' : 'justify-center'}`}
    >
      {isSyncingVisible && (
        <div className="pointer-events-none absolute left-4 top-2 z-10">
          <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] text-primary">
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
            {t('home.status.syncing')}
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={identity || 'no-identity'}
          className="flex w-full max-w-sm flex-col gap-5 px-4"
          variants={pageMotion}
          initial="initial"
          animate="animate"
          exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
        >
          <motion.div className="space-y-4 p-1" variants={sectionMotion}>
            <div className="flex items-start justify-end gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0"
                aria-label="Refresh"
                onClick={handleRefresh}
                disabled={isSyncingRaw}
              >
                <RefreshCwIcon className={`h-4 w-4 ${isSyncingRaw ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div>
              <BalanceCard
                balance={balance}
                identity={identity}
                pendingDebit={pendingOutgoingDebit}
                networkMeta={{ tick: tickValue, epoch: epochValue, price: pricePerBValue }}
              />
            </div>
            {isWatchOnly && (
              <div className="flex items-center justify-center gap-2">
                <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                  <EyeIcon className="h-3.5 w-3.5" />
                  {t('home.watchOnly.title')}
                </div>
              </div>
            )}
          </motion.div>

          {!isWatchOnly && (
            <motion.div className="grid grid-cols-2 gap-3" variants={sectionMotion}>
              <Button
                size="sm"
                className="h-12 w-full gap-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => navigate('/transfer')}
                disabled={hasPendingOutgoing}
                title={hasPendingOutgoing ? t('transfer.errors.pendingOutgoing') : undefined}
              >
                <SendIcon className="h-4 w-4" />
                {t('home.actions.send')}
              </Button>
              <Button
                size="sm"
                className="h-12 w-full gap-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => setIsReceiveOpen(true)}
              >
                <ReceiveIcon className="h-4 w-4" />
                {t('home.actions.receive')}
              </Button>
            </motion.div>
          )}

          <motion.div className="space-y-3" variants={sectionMotion}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t('home.recent.title')}
              </div>
              {transactions.isFetching && (
                <Loader2Icon className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <TransactionsPreview
              identity={identity}
              transactions={transactions}
              currentTick={currentTick}
              onViewMore={() => navigate('/history')}
              onOpenTx={(hash) => navigate(`/tx/${hash}`)}
            />
          </motion.div>

          <motion.div className="space-y-3" variants={sectionMotion}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t('home.assets.title')}
              </div>
              <div className="flex items-center gap-2">
                {ownedAssets.isFetching && (
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
            {ownedAssets.isLoading && (
              <div className="space-y-2">
                <div className="h-11 animate-pulse rounded-lg bg-muted/25" />
                <div className="h-11 animate-pulse rounded-lg bg-muted/25" />
              </div>
            )}
            {ownedAssets.error && (
              <div className="text-xs text-destructive">{t('home.assets.error')}</div>
            )}
            {ownedAssets.data && aggregatedAssets.length > 0 && (
              <div
                className={`app-scrollbar ${assetsListMaxHeightClass} space-y-2 overflow-y-auto pr-1`}
              >
                {aggregatedAssets.map((asset) => (
                  <div
                    key={`${asset.issuerIdentity}-${asset.name}`}
                    className="group flex items-center justify-between rounded-lg border border-border/40 bg-transparent px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-background/40"
                  >
                    <div className="min-w-0 flex flex-col">
                      <span className="truncate text-sm font-semibold leading-none text-foreground">
                        {asset.name}
                      </span>
                      {asset.issuerIdentity && (
                        <span className="truncate font-mono text-[11px] text-muted-foreground">
                          {truncateString(asset.issuerIdentity)}
                        </span>
                      )}
                    </div>
                    <div className="ml-3 shrink-0 text-right text-base font-semibold tabular-nums text-foreground">
                      {formatAssetUnits(asset.numberOfUnits, asset.decimals)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {ownedAssets.isSuccess && (!ownedAssets.data || aggregatedAssets.length === 0) && (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-transparent px-3 py-3 text-xs text-muted-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-transparent text-muted-foreground">
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
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <Drawer open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DrawerContent
          className={`max-h-[100vh] border-none bg-background px-4 pt-0 ${
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
