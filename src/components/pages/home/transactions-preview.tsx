import { useMemo } from 'react'
import { InboxIcon, XIcon } from 'lucide-react'
import type { useTransactions } from '@qubic-labs/react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import AddressLabel from '@/components/address-label'
import { formatBalanceCompact, toTimestampMs } from '@/lib/utils'
import { getTransactionPresentation } from '@/lib/transaction-presentation'
import { HIDDEN_BALANCE, useBalanceVisibility } from '@/lib/balance-visibility'
import {
  canResendPendingTransaction,
  type PendingTransaction,
  getPendingTransaction,
  removePendingTransaction,
} from '@/lib/pending-transactions'

type PreviewTransaction = {
  hash: string
  source: string
  destination: string
  amount: bigint
  tickNumber: number | bigint
  inputType: number | bigint
  tokenKey?: string
  timestamp: bigint
  status?: PendingTransaction['status']
}

type TransactionsPreviewProps = {
  identity: string
  transactions: ReturnType<typeof useTransactions>
  pendingTransactions: PendingTransaction[]
  onViewMore: () => void
  onOpenTx: (hash: string) => void
  onResend: (failedHash: string, recipient: string, amount: bigint, tokenKey?: string) => void
}

const TransactionsPreview = ({
  identity,
  transactions,
  pendingTransactions,
  onViewMore,
  onOpenTx,
  onResend,
}: TransactionsPreviewProps) => {
  const { t } = useTranslation()
  const { isVisible } = useBalanceVisibility()

  const { unconfirmedTop, unconfirmedOverflow, recentChain } = useMemo(() => {
    const items = transactions.data?.pages.flatMap((page) => page.transactions) ?? []
    const pendingItems: PreviewTransaction[] = pendingTransactions.map((tx) => ({
      hash: tx.hash,
      source: tx.sourceIdentity,
      destination: tx.destinationIdentity ?? '',
      amount: tx.amount ?? 0n,
      tickNumber: tx.targetTick,
      inputType: tx.inputType ?? 0,
      tokenKey: tx.tokenKey,
      timestamp: BigInt(tx.createdAt),
      status: tx.status,
    }))
    const pendingHashes = new Set(pendingItems.map((tx) => tx.hash.toLowerCase()))
    const unconfirmedTop = pendingItems.slice(0, 3)
    const unconfirmedOverflow = pendingItems.length - unconfirmedTop.length
    const recentChain: PreviewTransaction[] = items
      .filter((tx) => !pendingHashes.has(tx.hash.toLowerCase()))
      .slice(0, 3)

    return { unconfirmedTop, unconfirmedOverflow, recentChain }
  }, [transactions.data, pendingTransactions])

  const renderRow = (tx: PreviewTransaction) => {
    const { isIncoming, label, counterparty, Icon, addressPrefix, amountSign, amountColorClass } =
      getTransactionPresentation(tx, identity, t)
    const pendingStatus = getPendingTransaction(tx.hash)?.status
    const isPending = pendingStatus === 'pending'
    const isFailed = pendingStatus === 'failed'
    const isInvalid = pendingStatus === 'invalid'
    const isUnsuccessful = isFailed || isInvalid
    const canResend = canResendPendingTransaction({
      status: tx.status ?? 'pending',
      destinationIdentity: tx.destination,
      inputType: Number(tx.inputType),
      tokenKey: tx.tokenKey,
    })

    return (
      <motion.div
        key={tx.hash}
        className={`group relative flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
          isPending
            ? 'animate-pulse border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200'
            : isUnsuccessful
              ? 'border-red-500/50 bg-red-500/10 text-red-800 dark:text-red-200'
              : 'border-border/40 bg-background/40 hover:border-primary/30 hover:bg-background/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border ${
              isPending
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                : isUnsuccessful
                  ? 'border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300'
                  : isIncoming
                    ? 'border-positive/40 bg-positive/10 text-positive'
                    : 'border-[var(--destructive)]/40 bg-[var(--destructive)]/10 text-[var(--destructive)]'
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">{label}</span>
            <AddressLabel
              address={counterparty}
              prefix={addressPrefix}
              className="text-xs text-muted-foreground"
            />
            <span className="text-[11px] text-muted-foreground/70">
              {(() => {
                if (isFailed) return t('history.failed')
                if (isInvalid) return t('history.invalid')
                const ts = Number(tx.timestamp)
                if (!ts) return '--'
                const date = new Date(toTimestampMs(ts))
                const now = new Date()
                if (date.toDateString() === now.toDateString()) return t('history.today')
                const yesterday = new Date(now)
                yesterday.setDate(yesterday.getDate() - 1)
                if (date.toDateString() === yesterday.toDateString()) return t('history.yesterday')
                return date.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
                })
              })()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold ${
              !isVisible
                ? 'text-muted-foreground'
                : isPending
                  ? 'text-amber-700 dark:text-amber-300'
                  : isUnsuccessful
                    ? 'text-red-700 dark:text-red-300'
                    : amountColorClass
            }`}
          >
            {isVisible ? `${amountSign}${formatBalanceCompact(tx.amount)}` : HIDDEN_BALANCE}
          </span>
          {isUnsuccessful && (
            <div className="flex items-center gap-1">
              {canResend && (
                <button
                  type="button"
                  className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-primary hover:underline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onResend(tx.hash, tx.destination, tx.amount, tx.tokenKey)
                  }}
                >
                  {t('history.resend')}
                </button>
              )}
              {isInvalid && (
                <button
                  type="button"
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    removePendingTransaction(tx.hash)
                  }}
                  aria-label={t('history.deleteInvalid')}
                  title={t('history.deleteInvalid')}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        {!isUnsuccessful && (
          <button
            type="button"
            className="absolute inset-0 cursor-pointer rounded-xl"
            aria-label={t('txDetails.title')}
            onClick={() => onOpenTx(tx.hash)}
          />
        )}
      </motion.div>
    )
  }

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

  if (unconfirmedTop.length === 0 && recentChain.length === 0) {
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
      {unconfirmedTop.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase text-muted-foreground/70">
            {t('history.unconfirmed')}
          </div>
          {unconfirmedTop.map((tx) => renderRow(tx))}
          {unconfirmedOverflow > 0 && (
            <button
              type="button"
              className="w-full cursor-pointer text-center text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              onClick={onViewMore}
            >
              {t('history.unconfirmedMore', { count: unconfirmedOverflow })}
            </button>
          )}
        </div>
      )}
      {unconfirmedTop.length > 0 && recentChain.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="h-px w-full bg-border/40" />
          <div className="text-[11px] font-semibold uppercase text-muted-foreground/70">
            {t('history.confirmed')}
          </div>
        </div>
      )}
      {recentChain.map((tx) => renderRow(tx))}
    </div>
  )
}

export default TransactionsPreview
