import { useTransactions } from '@qubic-labs/react'
import { ArrowDownLeftIcon, ArrowUpRightIcon, HashIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildExplorerObjectUrl, truncateString } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const formatQus = (value: bigint) => {
  const formatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2,
  })
  return formatter.format(Number(value))
}

const History = () => {
  const { t } = useTranslation()
  const identity = localStorage.getItem('currentIdentity') ?? '...'
  const transactions = useTransactions(
    {
      identity,
      pageSize: 20,
      limit: 20,
    },
    { refetchInterval: 15_000 },
  )

  const items = transactions.data?.pages.flatMap((page) => page.transactions) ?? []
  const sorted = [...items].sort((a, b) => Number(b.tickNumber) - Number(a.tickNumber))

  return (
    <section className="flex min-h-full w-full justify-center pb-6 pt-4">
      <div className="flex w-full max-w-sm flex-col gap-4 px-6">
        <div className="flex items-center justify-between">
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
            <RefreshCwIcon className={`h-4 w-4 ${transactions.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {transactions.isLoading && (
          <div className="text-xs text-muted-foreground">{t('history.loading')}</div>
        )}

        {transactions.error && (
          <div className="text-xs text-destructive">{transactions.error.message}</div>
        )}

        {!transactions.isLoading && sorted.length === 0 && (
          <div className="text-xs text-muted-foreground">{t('history.empty')}</div>
        )}

        <div className="space-y-3">
          {sorted.map((tx) => {
            const isIncoming = tx.destination === identity
            const label = isIncoming ? t('history.incoming') : t('history.outgoing')
            const counterparty = isIncoming ? tx.source : tx.destination
            const Icon = isIncoming ? ArrowDownLeftIcon : ArrowUpRightIcon

            return (
              <div key={tx.hash} className="space-y-3 bg-muted/20 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
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
                        {truncateString(counterparty)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isIncoming ? 'text-primary' : 'text-[#ff6b6b]'
                    }`}
                  >
                    {isIncoming ? '+' : '-'}
                    {formatQus(tx.amount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <HashIcon className="h-3.5 w-3.5" />
                    <a
                      href={buildExplorerObjectUrl('tx', tx.hash)}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {truncateString(tx.hash, {
                        leading: 6,
                        trailing: 6,
                        minLength: 12,
                        emptyLabel: '',
                      })}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground/70">{t('history.tick')}</span>
                    <span>{tx.tickNumber.toString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground/70">{t('history.type')}</span>
                    <span>{tx.inputType.toString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default History
