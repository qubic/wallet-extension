import { ArrowDownLeftIcon, ArrowUpRightIcon, HashIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { buildExplorerObjectUrl, truncateString } from '@/lib/utils'

type HistoryItem = {
  hash: string
  source: string
  destination: string
  amount: bigint
  tickNumber: number | bigint
  inputType: number | bigint
}

type HistoryListItemProps = {
  tx: HistoryItem
  identity: string
  isPending: boolean
  itemMotion: {
    hidden: { opacity: number; y: number }
    show: { opacity: number; y: number; transition: { duration: number } }
  }
  formatQus: (value: bigint) => string
  onOpen: (hash: string) => void
}

const HistoryListItem = ({
  tx,
  identity,
  isPending,
  itemMotion,
  formatQus,
  onOpen,
}: HistoryListItemProps) => {
  const { t } = useTranslation()
  const isIncoming = tx.destination === identity
  const label = isIncoming ? t('history.incoming') : t('history.outgoing')
  const counterparty = isIncoming ? tx.source : tx.destination
  const Icon = isIncoming ? ArrowDownLeftIcon : ArrowUpRightIcon

  return (
    <motion.button
      type="button"
      key={tx.hash}
      className={`w-full cursor-pointer space-y-3 rounded-xl border px-3 py-3 text-left transition-colors ${
        isPending
          ? 'animate-pulse border-amber-500/50 bg-amber-500/10'
          : 'border-border/40 bg-background/40 hover:border-primary/30 hover:bg-background/60'
      }`}
      onClick={() => onOpen(tx.hash)}
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
            <span className="text-xs text-muted-foreground">{truncateString(counterparty)}</span>
          </div>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-sm font-semibold ${
            isPending
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              : isIncoming
                ? 'bg-primary/10 text-primary'
                : 'bg-[var(--destructive)]/10 text-[var(--destructive)]'
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
          <span>{tx.tickNumber.toString()}</span>
        </div>
        <div className="flex items-center gap-1 font-mono">
          <span className="text-muted-foreground/70">{t('history.type')}</span>
          <span>{tx.inputType.toString()}</span>
        </div>
      </div>
    </motion.button>
  )
}

export default HistoryListItem
