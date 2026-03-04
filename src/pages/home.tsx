import { useBalance, useTransactions } from '@qubic-labs/react'
import { CopyIcon, EyeIcon, Loader2Icon, PackageIcon, RefreshCwIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ReceiveIcon } from '@/components/icons/receive-icon'
import { SendIcon } from '@/components/icons/send-icon'
import { useTranslation } from 'react-i18next'
import { truncateString } from '@/lib/utils'
import { getCurrentIdentity, isWatchOnlyIdentity } from '@/lib/accounts'
import { aggregateAssets, formatAssetUnits, useOwnedAssets } from '@/lib/assets'
import { useLatestStats } from '@/lib/network-stats'
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'
import BalanceCard from '@/components/pages/home/balance-card'
import TransactionsPreview from '@/components/pages/home/transactions-preview'
import {
  getArchiverProcessedTick,
  PENDING_SETTLED_EVENT,
  getPendingTransactionsForIdentity,
  resolvePendingTransactions,
  usePendingTransactionsVersion,
} from '@/lib/pending-transactions'
import {
  REFRESH_INTERVAL_ACTIVE_BALANCE,
  REFRESH_INTERVAL_ACTIVE_TRANSACTIONS,
} from '@/lib/config/refresh-intervals'

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

const Home = () => {
  const { t } = useTranslation()
  usePendingTransactionsVersion()
  const [identity, setIdentity] = useState(getCurrentIdentity())
  const [isWatchOnly, setIsWatchOnly] = useState(() => isWatchOnlyIdentity(getCurrentIdentity()))
  const pathname = globalThis.location?.pathname ?? ''
  const isSidePanel = pathname.endsWith('sidepanel.html')
  const isPopup = pathname.endsWith('popup.html')
  const isConstrainedLayout = isPopup || isSidePanel

  const navigate = useNavigate()
  const { copyText } = useClipboardCopy()
  const balance = useBalance(identity, { refetchInterval: REFRESH_INTERVAL_ACTIVE_BALANCE })
  const latestStats = useLatestStats('home')
  const ownedAssets = useOwnedAssets(identity)
  const aggregatedAssets = ownedAssets.data ? aggregateAssets(ownedAssets.data) : []
  const transactions = useTransactions(
    {
      identity,
      pageSize: 5,
      limit: 5,
    },
    { refetchInterval: REFRESH_INTERVAL_ACTIVE_TRANSACTIONS },
  )
  const [isReceiveOpen, setIsReceiveOpen] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const pendingForIdentity = getPendingTransactionsForIdentity(identity)
  const pricePerQu = latestStats.data?.data?.price
  const pricePerBFormatted = pricePerQu ? `$${(pricePerQu * 1_000_000_000).toFixed(2)}` : '--'
  const handleRefresh = () => {
    void balance.refetch()
    void transactions.refetch()
  }
  const transactionItems = useMemo(
    () => transactions.data?.pages.flatMap((page) => page.transactions) ?? [],
    [transactions.data],
  )
  const archiverProcessedTick = useMemo(() => {
    return getArchiverProcessedTick(transactions.data?.pages)
  }, [transactions.data])
  const isSyncingRaw =
    balance.isFetching ||
    transactions.isFetching ||
    ownedAssets.isFetching ||
    latestStats.isFetching

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
    resolvePendingTransactions(transactionItems, archiverProcessedTick)
  }, [transactionItems, archiverProcessedTick])

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

  return (
    <section
      className={`app-scrollbar relative flex h-full w-full overflow-y-auto pt-4 ${isConstrainedLayout ? 'justify-start' : 'justify-center'}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={identity || 'no-identity'}
          className="flex w-full max-w-sm flex-col gap-5 px-4 pb-6"
          variants={pageMotion}
          initial="initial"
          animate="animate"
          exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
        >
          <motion.div className="space-y-4 p-1" variants={sectionMotion}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-muted-foreground">
                {t('home.price.label')}: {pricePerBFormatted}
              </div>
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
              <BalanceCard balance={balance} identity={identity} price={pricePerQu} />
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

          <motion.div className="space-y-3 pt-2" variants={sectionMotion}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t('home.recent.title')}
              </div>
              <div className="flex items-center gap-2">
                {transactions.isFetching && (
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
                <button
                  type="button"
                  className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => navigate('/history')}
                >
                  {t('home.recent.viewAll')}
                </button>
              </div>
            </div>
            <TransactionsPreview
              identity={identity}
              transactions={transactions}
              pendingTransactions={pendingForIdentity}
              onViewMore={() => navigate('/history')}
              onOpenTx={(hash) => navigate(`/tx/${hash}`)}
              onResend={(failedHash, recipient, amount, tokenKey) =>
                navigate(
                  `/transfer/send?failedHash=${encodeURIComponent(failedHash)}&recipient=${encodeURIComponent(recipient)}&amount=${encodeURIComponent(amount.toString())}&token=${encodeURIComponent(tokenKey ?? 'qu')}`,
                )
              }
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
              <div className="space-y-2">
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
