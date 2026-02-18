import { useTransactions } from '@qubic-labs/react'
import { HashIcon, RefreshCwIcon, XIcon } from 'lucide-react'
import { ReceiveIcon } from '@/components/icons/receive-icon'
import { SendIcon } from '@/components/icons/send-icon'
import { Button } from '@/components/ui/button'
import { useProcedureName } from '@/hooks/use-procedure-name'
import AddressLabel from '@/components/address-label'
import { buildExplorerObjectUrl, formatBalanceCompact, truncateString } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  getArchiverProcessedTick,
  canResendPendingTransaction,
  getPendingTransactionsForIdentity,
  PENDING_SETTLED_EVENT,
  removePendingTransaction,
  resolvePendingTransactions,
  usePendingTransactionsVersion,
} from '@/lib/pending-transactions'
import { getCurrentIdentity } from '@/lib/accounts'
import HistoryEmptyState from '@/components/pages/history/history-empty-state'

const HistoryRowSkeleton = () => (
  <div className="space-y-3 rounded-xl border border-border/40 bg-background/40 px-3 py-3">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-muted/40" />
        <div className="space-y-1.5">
          <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
          <div className="h-3 w-28 animate-pulse rounded bg-muted/30" />
        </div>
      </div>
      <div className="h-4 w-14 animate-pulse rounded bg-muted/40" />
    </div>
    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
      <div className="h-3 animate-pulse rounded bg-muted/30" />
      <div className="h-3 w-16 animate-pulse rounded bg-muted/30" />
      <div className="h-3 w-12 animate-pulse rounded bg-muted/30" />
    </div>
  </div>
)

type HistoryRowTransaction = {
  hash: string
  source: string
  destination: string
  amount: bigint
  tickNumber: number | bigint
  inputType: number | bigint
  tokenKey?: string
}

type HistoryRowState = 'default' | 'pending' | 'failed'

const InputTypeLabel = ({
  destination,
  inputType,
}: { destination: string; inputType: number }) => {
  const procedureName = useProcedureName(destination, inputType)
  if (procedureName) {
    return (
      <span>
        {inputType} ({procedureName})
      </span>
    )
  }
  return <span>{inputType.toString()}</span>
}

const History = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pendingVersion = usePendingTransactionsVersion()
  const [identity, setIdentity] = useState(getCurrentIdentity())
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const loadInFlightRef = useRef(false)
  const transactions = useTransactions(
    {
      identity,
      pageSize: 10,
    },
    { refetchInterval: 15_000 },
  )

  useEffect(() => {
    const refreshIdentity = () => {
      setIdentity(getCurrentIdentity())
    }

    refreshIdentity()
    window.addEventListener('storage', refreshIdentity)
    window.addEventListener('wallet-account-updated', refreshIdentity)
    return () => {
      window.removeEventListener('storage', refreshIdentity)
      window.removeEventListener('wallet-account-updated', refreshIdentity)
    }
  }, [])

  const items = useMemo(
    () => transactions.data?.pages.flatMap((page) => page.transactions) ?? [],
    [transactions.data],
  )
  const pending = useMemo(() => {
    void pendingVersion
    return getPendingTransactionsForIdentity(identity)
  }, [identity, pendingVersion])
  const archiverProcessedTick = useMemo(() => {
    return getArchiverProcessedTick(transactions.data?.pages)
  }, [transactions.data])
  const pendingHashes = useMemo(
    () => new Set(pending.map((tx) => tx.hash.toLowerCase())),
    [pending],
  )
  const pendingItems = useMemo(
    () =>
      pending.map((tx) => ({
        hash: tx.hash,
        source: tx.sourceIdentity,
        destination: tx.destinationIdentity ?? '',
        amount: tx.amount ?? 0n,
        tickNumber: tx.targetTick,
        inputType: tx.inputType ?? 0,
        tokenKey: tx.tokenKey,
        timestamp: BigInt(tx.createdAt),
        status: tx.status,
      })),
    [pending],
  )
  const apiItems = useMemo(
    () =>
      items
        .filter((tx) => !pendingHashes.has(tx.hash.toLowerCase()))
        .sort((a, b) => Number(b.tickNumber) - Number(a.tickNumber)),
    [items, pendingHashes],
  )
  const pendingTopItems = useMemo(
    () => pendingItems.filter((tx) => tx.status === 'pending'),
    [pendingItems],
  )
  const failedTopItems = useMemo(
    () => pendingItems.filter((tx) => tx.status === 'failed'),
    [pendingItems],
  )

  const grouped = useMemo(() => {
    const now = new Date()
    const todayKey = now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toDateString()

    const groups: Array<{
      key: string
      label: string
      items: typeof apiItems
    }> = []
    const groupMap = new Map<string, typeof apiItems>()

    for (const tx of apiItems) {
      const ts = Number(tx.timestamp)
      const date = new Date(ts > 1e12 ? ts : ts * 1000)
      const key = date.toDateString()
      const group = groupMap.get(key)
      if (group) {
        group.push(tx)
      } else {
        groupMap.set(key, [tx])
      }
    }

    for (const [key, groupItems] of groupMap) {
      let label: string
      if (key === todayKey) {
        label = t('history.today')
      } else if (key === yesterdayKey) {
        label = t('history.yesterday')
      } else {
        const date = new Date(key)
        label = date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        })
      }
      groups.push({ key, label, items: groupItems })
    }

    return groups
  }, [apiItems, t])
  const listMotion = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.03, delayChildren: 0.03 },
    },
  }
  const itemMotion = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  }
  const getRowPresentation = (tx: HistoryRowTransaction) => {
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
    const Icon = isIncoming ? ReceiveIcon : SendIcon

    return { isIncoming, isSimpleTransfer, label, counterparty, Icon }
  }

  const renderHistoryRow = (tx: HistoryRowTransaction, state: HistoryRowState) => {
    const { isIncoming, isSimpleTransfer, label, counterparty, Icon } = getRowPresentation(tx)
    const isPending = state === 'pending'
    const isDefault = state === 'default'

    return (
      <motion.button
        type="button"
        key={tx.hash}
        className={`w-full cursor-pointer space-y-3 rounded-xl border px-3 py-3 text-left transition-colors ${
          isPending
            ? 'border-amber-500/50 bg-amber-500/10'
            : 'border-border/40 bg-background/40 hover:border-primary/30 hover:bg-background/60'
        }`}
        onClick={() => navigate(`/tx/${tx.hash}`)}
        variants={itemMotion}
      >
        <div className="flex items-center justify-between gap-3">
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
              <AddressLabel address={counterparty} prefix={isSimpleTransfer ? (isIncoming ? t('history.fromPrefix') : t('history.toPrefix')) : undefined} className="text-xs text-muted-foreground" />
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
        </div>

        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <HashIcon className="h-3.5 w-3.5 shrink-0" />
              {isDefault ? (
                <a
                  href={buildExplorerObjectUrl('tx', tx.hash)}
                  className="truncate font-mono text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  {truncateString(tx.hash, {
                    leading: 6,
                    trailing: 6,
                    minLength: 12,
                    emptyLabel: '',
                  })}
                </a>
              ) : (
                <span className="truncate font-mono">
                  {truncateString(tx.hash, {
                    leading: 6,
                    trailing: 6,
                    minLength: 12,
                    emptyLabel: '',
                  })}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1 font-mono">
              <span className="text-muted-foreground/70">{t('history.tick')}</span>
              <span>{Number(tx.tickNumber).toLocaleString()}</span>
            </div>
            {Number(tx.inputType) === 0 && (
              <div className="flex items-center gap-1 font-mono">
                <span className="text-muted-foreground/70">{t('history.type')}</span>
                <span>0</span>
              </div>
            )}
          </div>
          {Number(tx.inputType) !== 0 && (
            <div className="flex items-center gap-1 font-mono">
              <span className="text-muted-foreground/70">{t('history.type')}</span>
              <InputTypeLabel destination={tx.destination} inputType={Number(tx.inputType)} />
            </div>
          )}
        </div>
      </motion.button>
    )
  }

  useEffect(() => {
    resolvePendingTransactions(items, archiverProcessedTick)
  }, [items, archiverProcessedTick])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target) return undefined
    if (!transactions.hasNextPage) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting) return
        if (transactions.isFetchingNextPage) return
        if (loadInFlightRef.current) return

        loadInFlightRef.current = true
        observer.unobserve(target)
        void transactions.fetchNextPage().finally(() => {
          loadInFlightRef.current = false
          if (transactions.hasNextPage) {
            observer.observe(target)
          }
        })
      },
      { rootMargin: '200px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [transactions.hasNextPage, transactions.isFetchingNextPage, transactions.fetchNextPage])

  useEffect(() => {
    const handlePendingSettled = () => {
      void transactions.refetch()
    }
    window.addEventListener(PENDING_SETTLED_EVENT, handlePendingSettled)
    return () => {
      window.removeEventListener(PENDING_SETTLED_EVENT, handlePendingSettled)
    }
  }, [transactions])

  return (
    <section className="flex w-full justify-center pt-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={identity || 'no-identity'}
          className="flex w-full max-w-sm flex-col gap-4 px-4"
          variants={listMotion}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
        >
          <motion.div className="flex items-center justify-between" variants={itemMotion}>
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              {t('history.title')}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              aria-label="Refresh history"
              onClick={() => transactions.refetch()}
              disabled={transactions.isFetching}
            >
              <RefreshCwIcon
                className={`h-4 w-4 ${transactions.isFetching ? 'animate-spin' : ''}`}
              />
            </Button>
          </motion.div>

          {transactions.isLoading && (
            <motion.div className="space-y-2" variants={itemMotion}>
              <HistoryRowSkeleton />
              <HistoryRowSkeleton />
              <HistoryRowSkeleton />
            </motion.div>
          )}

          {transactions.error && (
            <motion.div className="text-xs text-destructive" variants={itemMotion}>
              {transactions.error.message}
            </motion.div>
          )}

          {!transactions.isLoading &&
            pendingTopItems.length === 0 &&
            failedTopItems.length === 0 &&
            apiItems.length === 0 && (
              <motion.div variants={itemMotion}>
                <HistoryEmptyState />
              </motion.div>
            )}

          {(pendingTopItems.length > 0 || failedTopItems.length > 0) && (
            <motion.div className="space-y-2" variants={itemMotion}>
              {pendingTopItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground/70">
                    {t('history.pending')}
                  </span>
                  {pendingTopItems.map((tx) => renderHistoryRow(tx, 'pending'))}
                </div>
              )}

              {failedTopItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground/70">
                    {t('history.failed')}
                  </span>
                  {failedTopItems.map((tx) => {
                    const { isIncoming, isSimpleTransfer, label, counterparty, Icon } = getRowPresentation(tx)
                    const canResend = canResendPendingTransaction({
                      status: tx.status,
                      destinationIdentity: tx.destination,
                      inputType: Number(tx.inputType),
                      tokenKey: tx.tokenKey,
                    })

                    return (
                      <motion.div
                        key={tx.hash}
                        className="w-full space-y-3 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-3 text-left transition-colors"
                        variants={itemMotion}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground">{label}</span>
                              <AddressLabel address={counterparty} prefix={isSimpleTransfer ? (isIncoming ? t('history.fromPrefix') : t('history.toPrefix')) : undefined} className="text-xs text-muted-foreground" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                              {isIncoming ? '+' : '-'}
                              {formatBalanceCompact(tx.amount)}
                            </span>
                            <div className="flex items-center gap-1">
                              {canResend && (
                                <button
                                  type="button"
                                  className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-primary hover:underline"
                                  onClick={() =>
                                    navigate(
                                      `/transfer?failedHash=${encodeURIComponent(tx.hash)}&recipient=${encodeURIComponent(tx.destination)}&amount=${encodeURIComponent(tx.amount.toString())}&token=${encodeURIComponent(tx.tokenKey ?? 'qu')}`,
                                    )
                                  }
                                >
                                  {t('history.resend')}
                                </button>
                              )}
                              <button
                                type="button"
                                className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                                onClick={() => removePendingTransaction(tx.hash)}
                                aria-label={t('history.deleteFailed')}
                                title={t('history.deleteFailed')}
                              >
                                <XIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <HashIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate font-mono">
                                {truncateString(tx.hash, {
                                  leading: 6,
                                  trailing: 6,
                                  minLength: 12,
                                  emptyLabel: '',
                                })}
                              </span>
                            </div>
                            <div className="ml-auto flex items-center gap-1 font-mono">
                              <span className="text-muted-foreground/70">{t('history.tick')}</span>
                              <span>{Number(tx.tickNumber).toLocaleString()}</span>
                            </div>
                            {Number(tx.inputType) === 0 && (
                              <div className="flex items-center gap-1 font-mono">
                                <span className="text-muted-foreground/70">{t('history.type')}</span>
                                <span>0</span>
                              </div>
                            )}
                          </div>
                          {Number(tx.inputType) !== 0 && (
                            <div className="flex items-center gap-1 font-mono">
                              <span className="text-muted-foreground/70">{t('history.type')}</span>
                              <InputTypeLabel destination={tx.destination} inputType={Number(tx.inputType)} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {grouped.map((group) => (
            <motion.div key={group.key} className="space-y-2" variants={itemMotion}>
              <span className="text-[11px] font-semibold uppercase text-muted-foreground/70">
                {group.label}
              </span>
              {group.items.map((tx) => renderHistoryRow(tx, 'default'))}
            </motion.div>
          ))}

          {!transactions.isLoading && transactions.isFetchingNextPage && (
            <motion.div className="space-y-2" variants={itemMotion}>
              <HistoryRowSkeleton />
              <HistoryRowSkeleton />
            </motion.div>
          )}

          {!transactions.isLoading && transactions.hasNextPage && (
            <div ref={loadMoreRef} className="h-1" />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

export default History
