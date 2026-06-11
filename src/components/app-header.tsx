import {
  CopyIcon,
  EyeIcon,
  PanelRightOpenIcon,
  PlusIcon,
  UsersIcon,
  WalletIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatBalanceCompact, truncateString } from '@/lib/utils'
import { setOnboarded } from '@/lib/vault'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'
import { useQutilBalances } from '@/hooks/use-qutil-balance'
import { HIDDEN_BALANCE, useBalanceVisibility } from '@/lib/balance-visibility'
import {
  getAccountOrder,
  getCachedAccounts,
  getCurrentIdentity,
  getWatchOnlyAccounts,
} from '@/lib/accounts'
import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

type AppHeaderProps = {
  onToggleSidePanel: () => void
  isSidePanelView: boolean
  openSidePanelLabel: string
  closeSidePanelLabel: string
}

const AppHeader = ({
  onToggleSidePanel,
  isSidePanelView,
  openSidePanelLabel,
  closeSidePanelLabel,
}: AppHeaderProps) => {
  const { t } = useTranslation()
  const { isVisible } = useBalanceVisibility()
  const navigate = useNavigate()
  const { copyText } = useClipboardCopy({
    successTitle: t('home.toast.copySuccess'),
    successDescription: t('home.toast.copySuccessDesc'),
    errorTitle: t('home.toast.copyFail'),
    errorDescription: t('home.toast.copyFailDesc'),
  })
  const [accountName, setAccountName] = useState(
    localStorage.getItem('currentAccountName') ?? t('home.hero.defaultAccount'),
  )
  const [identity, setIdentity] = useState(getCurrentIdentity())
  const [accounts, setAccounts] = useState<
    Array<{ name: string; identity: string; watchOnly?: boolean }>
  >([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const refreshAccounts = useCallback(() => {
    const nextAccountName =
      localStorage.getItem('currentAccountName') ?? t('home.hero.defaultAccount')
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
  }, [t])

  const balances = useQutilBalances(
    accounts.map((account) => account.identity),
    { enabled: isMenuOpen },
  )
  const balanceByIdentity = balances.data ?? new Map<string, bigint>()
  const handleCopyIdentity = async () => {
    await copyText(identity)
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
                <span
                  className="truncate text-sm font-semibold text-foreground"
                  title={accountName}
                >
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
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                            {account.name}
                          </span>
                          {account.watchOnly && (
                            <EyeIcon className="size-3 shrink-0 text-muted-foreground" />
                          )}
                          {account.identity === identity && (
                            <span className="shrink-0 text-[11px] text-primary">
                              {t('accounts.manage.active')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{truncateString(account.identity)}</span>
                          <span className="shrink-0 text-[11px] font-semibold text-foreground">
                            {isVisible
                              ? balanceByIdentity.has(account.identity)
                                ? formatBalanceCompact(
                                    balanceByIdentity.get(account.identity) ?? 0n,
                                  )
                                : '--'
                              : HIDDEN_BALANCE}
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
          onClick={onToggleSidePanel}
          aria-label={isSidePanelView ? closeSidePanelLabel : openSidePanelLabel}
          className="h-9 w-9"
        >
          {isSidePanelView ? (
            <XIcon className="size-4" />
          ) : (
            <PanelRightOpenIcon className="size-4" />
          )}
        </Button>
      </div>
    </header>
  )
}

export default AppHeader
