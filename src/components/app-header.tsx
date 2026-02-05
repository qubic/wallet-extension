import { motion } from 'framer-motion'
import {
  CopyIcon,
  PanelRightOpenIcon,
  SquareArrowOutUpRightIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { truncateString } from '@/lib/utils'
import { openBrowserVault, setOnboarded } from '@/lib/vault'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

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
  const [accountName, setAccountName] = useState(
    localStorage.getItem('currentAccountName') ?? 'Main account',
  )
  const [identity, setIdentity] = useState(localStorage.getItem('currentIdentity') ?? '')
  const [accounts, setAccounts] = useState<Array<{ name: string; identity: string }>>([])
  const [hasLoadedAccounts, setHasLoadedAccounts] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadAccounts = async () => {
    if (hasLoadedAccounts || isLoadingAccounts) return
    if (!passphrase.trim()) {
      setLoadError(t('home.accounts.passphraseRequired'))
      return
    }
    setLoadError(null)
    setIsLoadingAccounts(true)
    try {
      const vault = await openBrowserVault(passphrase, false)
      const entries = vault.list().map((entry) => ({
        name: entry.name,
        identity: entry.identity,
      }))
      setAccounts(entries)
    } catch {
      setLoadError(t('home.accounts.unlockFailed'))
      setAccounts([])
    } finally {
      setHasLoadedAccounts(true)
      setIsLoadingAccounts(false)
    }
  }

  const handleSelectAccount = (selected: { name: string; identity: string }) => {
    setOnboarded(selected.identity, selected.name)
    setAccountName(selected.name)
    setIdentity(selected.identity)
    setIsMenuOpen(false)
  }

  useEffect(() => {
    const refresh = () => {
      setAccountName(localStorage.getItem('currentAccountName') ?? 'Main account')
      setIdentity(localStorage.getItem('currentIdentity') ?? '')
      setHasLoadedAccounts(false)
      setLoadError(null)
      setAccounts([])
    }

    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  const handleCopy = async () => {
    if (!identity) return
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

  return (
    <header className="z-20 flex items-center justify-between gap-4 border-b border-border/60 bg-background px-4 py-4">
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-3 text-left"
            aria-label={t('home.accounts.selectLabel')}
            onMouseEnter={() => setIsMenuOpen(true)}
          >
            <div className="flex h-10 w-10 items-center justify-center border border-border/60 bg-muted/20">
              <WalletIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">{accountName}</span>
              <span className="text-xs text-muted-foreground">{truncateString(identity)}</span>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 p-3"
          onMouseEnter={() => setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <UsersIcon className="h-4 w-4" />
            {t('home.accounts.title')}
          </div>
          <div className="mt-3 space-y-2">
            {!hasLoadedAccounts && (
              <div className="space-y-2">
                <Input
                  type="password"
                  value={passphrase}
                  onChange={(event) => setPassphrase(event.target.value)}
                  placeholder={t('home.accounts.passphrasePlaceholder')}
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={loadAccounts}
                  disabled={!passphrase || isLoadingAccounts}
                >
                  {isLoadingAccounts ? t('home.accounts.unlocking') : t('home.accounts.unlock')}
                </Button>
                {loadError && <p className="text-xs text-destructive">{loadError}</p>}
              </div>
            )}
            {hasLoadedAccounts && accounts.length === 0 && (
              <div className="text-xs text-muted-foreground">{t('home.accounts.empty')}</div>
            )}
            {hasLoadedAccounts && accounts.length > 0 && (
              <div className="space-y-1">
                {accounts.map((account) => (
                  <button
                    key={account.identity}
                    type="button"
                    onClick={() => handleSelectAccount(account)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition hover:bg-muted/30 ${
                      account.identity === identity ? 'bg-muted/20' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{account.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {truncateString(account.identity)}
                      </span>
                    </div>
                    {account.identity === identity && (
                      <span className="text-[11px] text-primary">Active</span>
                    )}
                  </button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full justify-start gap-2 text-xs text-muted-foreground"
                  onClick={() => {
                    setIsMenuOpen(false)
                    toast.info(t('home.accounts.createTitle'), {
                      description: t('home.accounts.createDesc'),
                    })
                  }}
                >
                  <UsersIcon className="h-4 w-4" />
                  {t('home.accounts.create')}
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopy}
            aria-label="Copy address"
            className="h-9 w-9"
            disabled={!identity}
          >
            <CopyIcon className="size-4" />
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            onClick={onOpenSidePanel}
            aria-label={openSidePanelLabel}
            className="h-9 w-9"
          >
            <PanelRightOpenIcon className="size-4" />
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            onClick={onOpenTab}
            aria-label={openTabLabel}
            className="h-9 w-9"
          >
            <SquareArrowOutUpRightIcon className="size-4" />
          </Button>
        </motion.div>
      </div>
    </header>
  )
}

export default AppHeader
