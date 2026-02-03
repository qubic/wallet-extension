import { useBalance, useTransactions } from '@qubic-labs/react'
import { ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-react'

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

const BalanceCard = ({ identity }: { identity: string }) => {
  const balance = useBalance(identity, { refetchInterval: 10_000 })

  if (balance.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  if (balance.error) {
    return <div className="text-sm text-destructive">{balance.error.message}</div>
  }

  const rawBalance = balance.data?.balance ?? 0n
  const normalized =
    typeof rawBalance === 'bigint'
      ? rawBalance
      : BigInt(typeof rawBalance === 'number' ? Math.floor(rawBalance) : rawBalance)

  return (
    <div className="text-center">
      <div className="text-4xl font-semibold text-foreground">
        {formatQus(normalized)} <span className="text-lg text-muted-foreground">qus</span>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{formatUsd(normalized)}</div>
    </div>
  )
}

const TransactionsPreview = ({ identity }: { identity: string }) => {
  const transactions = useTransactions(
    {
      identity,
      pageSize: 5,
      limit: 5,
    },
    { refetchInterval: 15_000 },
  )

  if (transactions.isLoading) {
    return <div className="text-xs text-muted-foreground">Loading recent activity...</div>
  }

  if (transactions.error) {
    return (
      <div className="text-xs text-destructive">{transactions.error.message}</div>
    )
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
          <div
            key={tx.hash}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                  isIncoming
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {formatIdentity(counterparty)}
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                  Tick {tx.tickNumber}
                </span>
              </div>
            </div>
            <span
              className={`text-sm font-medium ${
                isIncoming ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {isIncoming ? '+' : '-'}{formatQus(tx.amount)} qus
            </span>
          </div>
        )
      })}
    </div>
  )
}

const Home = () => {
  const identity = localStorage.getItem('currentIdentity') ?? '...'

  return (
    <section className="flex h-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-6">
        <BalanceCard identity={identity} />
        <div className="w-full">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Recent activity
          </div>
          <TransactionsPreview identity={identity} />
        </div>
      </div>
    </section>
  )
}

export default Home
