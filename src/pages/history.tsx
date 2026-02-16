import { useTransactions } from '@qubic-labs/react'
import { HashIcon, RefreshCwIcon } from 'lucide-react'
import { ReceiveIcon } from '@/components/icons/receive-icon'
import { SendIcon } from '@/components/icons/send-icon'
import { Button } from '@/components/ui/button'
import { buildExplorerObjectUrl, truncateString } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  getPendingTransactionsForIdentity,
  PENDING_SETTLED_EVENT,
  isTransactionPending,
  resolvePendingTransactions,
  usePendingTransactionsVersion,
} from '@/lib/pending-transactions'
import { getCurrentIdentity } from '@/lib/accounts'
import { useLatestStats } from '@/lib/network-stats'
import HistoryEmptyState from '@/components/pages/history/history-empty-state'

const formatQus = (value: bigint) => {
  const formatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2,
  })
  return formatter.format(Number(value))
}

const History = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  usePendingTransactionsVersion()
  const [identity, setIdentity] = useState(getCurrentIdentity())
  const transactions = useTransactions(
    {
      identity,
      pageSize: 20,
      limit: 20,
    },
    { refetchInterval: 15_000 },
  )
  const latestStats = useLatestStats('history')

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

  const currentTick = latestStats.data?.data?.currentTick
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
  const sorted = [
    ...pendingItems,
    ...items.filter((tx) => !pendingHashes.has(tx.hash.toLowerCase())),
  ].sort((a, b) => Number(b.tickNumber) - Number(a.tickNumber))

  const grouped = useMemo(() => {
    const now = new Date()
    const todayKey = now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toDateString()

    const groups: Array<{
      key: string
      label: string
      items: typeof sorted
    }> = []
    const groupMap = new Map<string, typeof sorted>()

    for (const tx of sorted) {
      const isPending = isTransactionPending(tx.hash, currentTick)
      let key: string
      if (isPending) {
        key = '__pending__'
      } else {
        const ts = Number(tx.timestamp)
        const date = new Date(ts > 1e12 ? ts : ts * 1000)
        key = date.toDateString()
      }
      const group = groupMap.get(key)
      if (group) {
        group.push(tx)
      } else {
        groupMap.set(key, [tx])
      }
    }

    for (const [key, groupItems] of groupMap) {
      let label: string
      if (key === '__pending__') {
        label = t('history.pending')
      } else if (key === todayKey) {
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
  }, [sorted, currentTick, t])
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

  useEffect(() => {
    resolvePendingTransactions(items, currentTick)
  }, [items, currentTick])

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
              <div className="h-16 animate-pulse rounded-xl border border-border/40 bg-muted/20" />
              <div className="h-16 animate-pulse rounded-xl border border-border/40 bg-muted/20" />
              <div className="h-16 animate-pulse rounded-xl border border-border/40 bg-muted/20" />
            </motion.div>
          )}

          {transactions.error && (
            <motion.div className="text-xs text-destructive" variants={itemMotion}>
              {transactions.error.message}
            </motion.div>
          )}

          {!transactions.isLoading && sorted.length === 0 && (
            <motion.div variants={itemMotion}>
              <HistoryEmptyState />
            </motion.div>
          )}

          {grouped.map((group) => (
            <motion.div key={group.key} className="space-y-2" variants={itemMotion}>
              <span className="text-[11px] font-semibold uppercase text-muted-foreground/70">
                {group.label}
              </span>
              {group.items.map((tx) => {
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
                    className={`w-full cursor-pointer space-y-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                      isPending
                        ? 'animate-pulse border-amber-500/50 bg-amber-500/10'
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
                          <span className="text-xs text-muted-foreground">{counterpartyLabel}</span>
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
                        {formatQus(tx.amount)}
                      </span>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-[11px] text-muted-foreground">
                      <div className="flex min-w-0 items-center gap-2">
                        <HashIcon className="h-3.5 w-3.5" />
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
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-muted-foreground/70">{t('history.tick')}</span>
                        <span>{Number(tx.tickNumber).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-muted-foreground/70">{t('history.type')}</span>
                        <span>{tx.inputType.toString()}</span>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

export default History
