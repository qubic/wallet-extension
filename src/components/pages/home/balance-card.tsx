import { useEffect, useRef, useState } from 'react'
import type { useBalance } from '@qubic-labs/react'
import { useTranslation } from 'react-i18next'
import { formatBalanceCompact, formatUsd, normalizeBalance } from '@/lib/utils'
import { HIDDEN_BALANCE, useBalanceVisibility } from '@/lib/balance-visibility'

const formatUsdFromNumber = (value: number, pricePerQu?: number) => {
  if (!pricePerQu) return '--'
  return formatUsd(value * pricePerQu)
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
  price?: number
}

const BalanceCard = ({ balance, identity, price }: BalanceCardProps) => {
  const { t } = useTranslation()
  const { isVisible, toggle } = useBalanceVisibility()
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

  const displayValue = normalized
  const eyeIcon = isVisible ? '/icons/eye-closed.png' : '/icons/eye-open.png'

  return (
    <div className="space-y-2 text-center">
      <button
        type="button"
        className="mx-auto flex cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        onClick={toggle}
        aria-label={t(isVisible ? 'home.balance.hide' : 'home.balance.show')}
      >
        {t('home.balance.title')}
        <img src={eyeIcon} alt="" className="h-3.5 w-3.5 opacity-60" />
      </button>
      <div
        className={`text-4xl font-semibold leading-none tracking-tight text-foreground transition-all duration-400 ${
          balanceChanged ? 'scale-105 text-primary' : ''
        }`}
      >
        {isVisible ? formatBalanceCompact(displayValue) : HIDDEN_BALANCE}
      </div>
      <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
        {isVisible ? `≈ ${formatUsdFromNumber(Number(displayValue), price)}` : HIDDEN_BALANCE}
      </div>
    </div>
  )
}

export default BalanceCard
