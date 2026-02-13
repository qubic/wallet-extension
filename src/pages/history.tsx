import { useTransactions } from '@qubic-labs/react'
import { ArrowDownLeftIcon, ArrowUpRightIcon, HashIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildExplorerObjectUrl, truncateString } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const formatQus = (value: bigint) => {
  const formatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2,
  })
  return formatter.format(Number(value))
}

const History = () => {
  const { t } = useTranslation()
  const [identity, setIdentity] = useState(localStorage.getItem('currentIdentity') ?? '')
  const transactions = useTransactions(
    {
      identity,
      pageSize: 20,
      limit: 20,
    },
    { refetchInterval: 15_000 },
  )

  useEffect(() => {
    const refreshIdentity = () => {
      setIdentity(localStorage.getItem('currentIdentity') ?? '')
    }

    refreshIdentity()
    window.addEventListener('storage', refreshIdentity)
    window.addEventListener('wallet-account-updated', refreshIdentity)
    return () => {
      window.removeEventListener('storage', refreshIdentity)
      window.removeEventListener('wallet-account-updated', refreshIdentity)
    }
  }, [])

  const items = transactions.data?.pages.flatMap((page) => page.transactions) ?? []
  const sorted = [...items].sort((a, b) => Number(b.tickNumber) - Number(a.tickNumber))
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

  return (
    <section className="flex w-full justify-center pt-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={identity || 'no-identity'}
          className="flex w-full max-w-sm flex-col gap-4 px-6"
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
            <motion.div className="text-xs text-muted-foreground" variants={itemMotion}>
              {t('history.loading')}
            </motion.div>
          )}

          {transactions.error && (
            <motion.div className="text-xs text-destructive" variants={itemMotion}>
              {transactions.error.message}
            </motion.div>
          )}

          {!transactions.isLoading && sorted.length === 0 && (
            <motion.div className="text-xs text-muted-foreground" variants={itemMotion}>
              {t('history.empty')}
            </motion.div>
          )}

          <motion.div className="space-y-3" variants={itemMotion}>
            {sorted.map((tx) => {
              const isIncoming = tx.destination === identity
              const label = isIncoming ? t('history.incoming') : t('history.outgoing')
              const counterparty = isIncoming ? tx.source : tx.destination
              const Icon = isIncoming ? ArrowDownLeftIcon : ArrowUpRightIcon

              return (
                <motion.div
                  key={tx.hash}
                  className="space-y-3 rounded-lg bg-card px-3 py-3"
                  variants={itemMotion}
                >
                  <div className="flex items-center justify-between gap-3">
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
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isIncoming ? 'text-primary' : 'text-[var(--destructive)]'
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
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

export default History
