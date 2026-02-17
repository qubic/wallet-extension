import { useEffect, useRef, useState } from 'react'
import type { useBalance } from '@qubic-labs/react'
import { useTranslation } from 'react-i18next'
import { formatBalanceCompact, normalizeBalance } from '@/lib/utils'

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

type BalanceCardProps = {
  balance: ReturnType<typeof useBalance>
  identity: string
  pendingDebit: bigint
  networkMeta: {
    tick: string | number
    epoch: string | number
    price: string
  }
}

const BalanceCard = ({ balance, identity, pendingDebit, networkMeta }: BalanceCardProps) => {
  const { t } = useTranslation()
  const [cachedBalance, setCachedBalanceState] = useState<bigint | null>(() =>
    getCachedBalance(identity),
  )
  const normalized = normalizeBalance(balance.data?.balance ?? cachedBalance ?? 0n)
  const prevBalanceRef = useRef(normalized)
  const [balanceChanged, setBalanceChanged] = useState(false)

  useEffect(() => {
    setCachedBalanceState(getCachedBalance(identity))
    prevBalanceRef.current = normalizeBalance(getCachedBalance(identity) ?? 0n)
  }, [identity])

  useEffect(() => {
    if (balance.data?.balance === undefined) return
    setCachedBalance(identity, balance.data.balance)
    setCachedBalanceState(balance.data.balance)
  }, [balance.data?.balance, identity])

  useEffect(() => {
    if (prevBalanceRef.current === normalized) return
    prevBalanceRef.current = normalized
    setBalanceChanged(true)
    const timer = window.setTimeout(() => setBalanceChanged(false), 400)
    return () => window.clearTimeout(timer)
  }, [normalized])

  if (balance.isLoading && cachedBalance == null) {
    return <div className="text-sm text-muted-foreground">{t('home.balance.loading')}</div>
  }

  if (balance.error) {
    return <div className="text-sm text-destructive">{balance.error.message}</div>
  }

  const effectiveBalance = normalized > pendingDebit ? normalized - pendingDebit : 0n
  const pendingActive = pendingDebit > 0n
  const displayValue = effectiveBalance

  return (
    <div className="space-y-3 text-center">
      <div
        className={`text-5xl font-semibold leading-none tracking-tight text-foreground transition-all duration-400 ${
          balanceChanged ? 'scale-105 text-primary' : ''
        }`}
      >
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

export default BalanceCard
