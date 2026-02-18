import {
  CopyIcon,
  EyeIcon,
  PanelRightOpenIcon,
  PlusIcon,
  SquareArrowOutUpRightIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { truncateString } from '@/lib/utils'
import { setOnboarded } from '@/lib/vault'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useQueries } from '@tanstack/react-query'
import { useSdk } from '@qubic-labs/react'
import { formatBalanceCompact } from '@/lib/utils'
import {
  getAccountOrder,
  getCachedAccounts,
  getCurrentIdentity,
  getWatchOnlyAccounts,
} from '@/lib/accounts'
import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

type AppHeaderProps = {
  onOpenSidePanel: () => void
  onOpenTab: () => void
  openSidePanelLabel: string
  openTabLabel: string
}

const AppHeader = ({
  onOpenSidePanel,
  onOpenTab,
  openSidePanelLabel,
  openTabLabel,
}: AppHeaderProps) => {
  const { t } = useTranslation()
  const sdk = useSdk()
  const navigate = useNavigate()
  const [accountName, setAccountName] = useState(
    localStorage.getItem('currentAccountName') ?? 'Main account',
  )
  const [identity, setIdentity] = useState(getCurrentIdentity())
  const [accounts, setAccounts] = useState<
    Array<{ name: string; identity: string; watchOnly?: boolean }>
  >([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const refreshAccounts = useCallback(() => {
    const nextAccountName = localStorage.getItem('currentAccountName') ?? 'Main account'
    const nextIdentity = getCurrentIdentity()
    setAccountName(nextAccountName)
    setIdentity(nextIdentity)

    const cached = getCachedAccounts()
    const watchOnly = getWatchOnlyAccounts().map((entry) => ({
      name: entry.name,
      identity: entry.identity,
      watchOnly: true as const,
    }))
    const combined = [...cached, ...watchOnly]
    const unique = new Map(combined.map((entry) => [entry.identity, entry]))

    if (nextIdentity && !unique.has(nextIdentity)) {
      unique.set(nextIdentity, {
        name: nextAccountName,
        identity: nextIdentity,
      })
    }

    const entries = Array.from(unique.values())
    const order = getAccountOrder()
    const byIdentity = new Map(entries.map((entry) => [entry.identity, entry]))
    const ordered = order
      .map((accountIdentity) => byIdentity.get(accountIdentity))
      .filter(Boolean) as Array<{ name: string; identity: string; watchOnly?: boolean }>
    const remaining = entries.filter((entry) => !order.includes(entry.identity))
    setAccounts([...ordered, ...remaining])
  }, [])

  const balanceQueries = useQueries({
    queries: accounts.map((account) => ({
      queryKey: ['qubic', 'balance', account.identity],
      queryFn: () => sdk.rpc.live.balance(account.identity),
      enabled: accounts.length > 0,
      refetchInterval: 20_000,
    })),
  })

  const balanceByIdentity = useMemo(() => {
    const map = new Map<string, bigint>()
    accounts.forEach((account, index) => {
      const data = balanceQueries[index]?.data
      if (data?.balance !== undefined) {
        map.set(account.identity, data.balance)
      }
    })
    return map
  }, [accounts, balanceQueries])

  const handleCopyIdentity = async () => {
    try {
      await navigator.clipboard.writeText(identity)
      toast.success(t('home.toast.copySuccess'), {
        description: t('home.toast.copySuccessDesc'),
      })
    } catch {
      toast.error(t('home.toast.copyFail'), {
        description: t('home.toast.copyFailDesc'),
      })
    }
  }

  const handleSelectAccount = (selected: { name: string; identity: string }) => {
    setOnboarded(selected.identity, selected.name)
    setAccountName(selected.name)
    setIdentity(selected.identity)
    setIsMenuOpen(false)
    navigate('/home')
  }

  useEffect(() => {
    refreshAccounts()
    window.addEventListener('storage', refreshAccounts)
    window.addEventListener('wallet-account-updated', refreshAccounts)
    return () => {
      window.removeEventListener('storage', refreshAccounts)
      window.removeEventListener('wallet-account-updated', refreshAccounts)
    }
  }, [refreshAccounts])

  return (
    <header className="z-20 flex items-center justify-between gap-4 rounded-b-2xl border-b border-border/60 bg-background/95 px-4 py-4 shadow-[0_10px_25px_-18px_hsl(var(--primary)/0.45)] backdrop-blur supports-[backdrop-filter]:bg-background/82">
      <div className="flex min-w-0 items-center gap-1">
        <Popover
          open={isMenuOpen}
          onOpenChange={(open) => {
            setIsMenuOpen(open)
            if (open) {
              refreshAccounts()
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 items-center gap-3 text-left"
              aria-label={t('home.accounts.selectLabel')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border/60 bg-card">
                <WalletIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-foreground">
                  {accountName}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{truncateString(identity)}</span>
                  <button
                    type="button"
                    className="shrink-0 rounded p-0.5 transition-colors hover:bg-muted/40"
                    aria-label={t('home.receive.copy')}
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleCopyIdentity()
                    }}
                  >
                    <CopyIcon className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <UsersIcon className="h-4 w-4" />
                {t('home.accounts.title')}
              </div>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/20"
                onClick={() => {
                  setIsMenuOpen(false)
                  navigate('/accounts', { state: { openAdd: true } })
                }}
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {accounts.length === 0 && (
                <div className="text-xs text-muted-foreground">{t('home.accounts.empty')}</div>
              )}
              {accounts.length > 0 && (
                <div className="max-h-[50vh] space-y-1 overflow-y-auto">
                  {accounts.map((account) => (
                    <button
                      key={account.identity}
                      type="button"
                      onClick={() => handleSelectAccount(account)}
                      className={`flex w-full items-center rounded-md px-2 py-2 text-left text-sm transition hover:bg-muted/30 ${
                        account.identity === identity ? 'bg-muted/20' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-foreground">
                            {account.name}
                          </span>
                          {account.watchOnly && (
                            <EyeIcon className="size-3 shrink-0 text-muted-foreground" />
                          )}
                          {account.identity === identity && (
                            <span className="shrink-0 text-[11px] text-primary">Active</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{truncateString(account.identity)}</span>
                          <span className="shrink-0 text-[11px] font-semibold text-foreground">
                            {balanceByIdentity.has(account.identity)
                              ? formatBalanceCompact(balanceByIdentity.get(account.identity) ?? 0n)
                              : '--'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Button
          size="icon"
          variant="ghost"
          onClick={onOpenSidePanel}
          aria-label={openSidePanelLabel}
          className="h-9 w-9"
        >
          <PanelRightOpenIcon className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onOpenTab}
          aria-label={openTabLabel}
          className="h-9 w-9"
        >
          <SquareArrowOutUpRightIcon className="size-4" />
        </Button>
      </div>
    </header>
  )
}

export default AppHeader
