import { useMemo } from 'react'
import { InboxIcon } from 'lucide-react'
import type { useTransactions } from '@qubic-labs/react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { formatBalanceCompact, truncateString } from '@/lib/utils'
import { ReceiveIcon } from '@/components/icons/receive-icon'
import { SendIcon } from '@/components/icons/send-icon'
import {
  getPendingTransactionsForIdentity,
  isTransactionPending,
  usePendingTransactionsVersion,
} from '@/lib/pending-transactions'

type TransactionsPreviewProps = {
  identity: string
  transactions: ReturnType<typeof useTransactions>
  currentTick?: number
  onViewMore: () => void
  onOpenTx: (hash: string) => void
}

const TransactionsPreview = ({
  identity,
  transactions,
  currentTick,
  onViewMore,
  onOpenTx,
}: TransactionsPreviewProps) => {
  const { t } = useTranslation()
  usePendingTransactionsVersion()

  const recent = useMemo(() => {
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
    return merged.slice(0, 3)
  }, [transactions.data, identity, currentTick])

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

export default TransactionsPreview
