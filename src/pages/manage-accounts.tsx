import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { useSdk } from '@qubic-labs/react'
import { VaultInvalidPassphraseError, VaultEntryNotFoundError } from '@qubic-labs/sdk'
import {
  CheckIcon,
  CopyIcon,
  GripVerticalIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusCircleIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  UploadIcon,
  WalletIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  getAccountOrder,
  getCachedAccounts,
  getWatchOnlyAccounts,
  saveAccountOrder,
  saveCachedAccounts,
  saveWatchOnlyAccounts,
} from '@/lib/accounts'
import { formatBalanceCompact, truncateString } from '@/lib/utils'
import { clearOnboarded, openBrowserVault, setOnboarded } from '@/lib/vault'

type AccountEntry = {
  name: string
  identity: string
  watchOnly?: boolean
}

const ManageAccounts = () => {
  const { t } = useTranslation()
  const sdk = useSdk()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<AccountEntry[]>(() => {
    const cached = getCachedAccounts().map((entry) => ({
      name: entry.name,
      identity: entry.identity,
    }))
    const watchOnly = getWatchOnlyAccounts().map((entry) => ({
      name: entry.name,
      identity: entry.identity,
      watchOnly: true,
    }))
    return [...cached, ...watchOnly]
  })
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const currentIdentity = localStorage.getItem('currentIdentity')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [renameTarget, setRenameTarget] = useState<AccountEntry | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState('')
  const [seedTarget, setSeedTarget] = useState<AccountEntry | null>(null)
  const [revealedSeed, setRevealedSeed] = useState('')
  const [removeTarget, setRemoveTarget] = useState<AccountEntry | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [vaultPassphrase, setVaultPassphrase] = useState('')
  const [passphrasePromptOpen, setPassphrasePromptOpen] = useState(false)
  const [passphraseInput, setPassphraseInput] = useState('')
  const [passphraseError, setPassphraseError] = useState('')
  const [pendingAction, setPendingAction] = useState<
    | { type: 'load' }
    | { type: 'remove'; account: AccountEntry }
    | { type: 'reveal'; account: AccountEntry }
    | { type: 'rename'; account: AccountEntry; name: string }
    | null
  >(null)

  const orderedAccounts = useMemo(() => {
    const order = getAccountOrder()
    if (order.length === 0) return accounts
    const lookup = new Map(accounts.map((account) => [account.identity, account]))
    const ordered = order.map((id) => lookup.get(id)).filter(Boolean) as AccountEntry[]
    const remaining = accounts.filter((account) => !order.includes(account.identity))
    return [...ordered, ...remaining]
  }, [accounts])

  const refreshFromCache = useCallback(() => {
    const cached = getCachedAccounts().map((entry) => ({
      name: entry.name,
      identity: entry.identity,
    }))
    const watchOnly = getWatchOnlyAccounts().map((entry) => ({
      name: entry.name,
      identity: entry.identity,
      watchOnly: true,
    }))
    setAccounts([...cached, ...watchOnly])
  }, [])

  useEffect(() => {
    refreshFromCache()
  }, [refreshFromCache])

  useEffect(() => {
    const handleStorage = () => refreshFromCache()
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [refreshFromCache])

  const balanceQueries = useQueries({
    queries: orderedAccounts.map((account) => ({
      queryKey: ['qubic', 'balance', account.identity],
      queryFn: () => sdk.rpc.live.balance(account.identity),
      enabled: Boolean(account.identity),
      refetchInterval: 20_000,
    })),
  })

  const balanceByIdentity = useMemo(() => {
    const map = new Map<string, bigint>()
    orderedAccounts.forEach((account, index) => {
      const data = balanceQueries[index]?.data
      if (data?.balance !== undefined) {
        map.set(account.identity, data.balance)
      }
    })
    return map
  }, [balanceQueries, orderedAccounts])

  const loadAccounts = async (passphrase: string) => {
    setStatus(null)
    setLoading(true)
    try {
      const vault = await openBrowserVault(passphrase, false)
      const entries = vault.list().map((entry) => ({
        name: entry.name,
        identity: entry.identity,
      }))
      saveCachedAccounts(entries)
      const watchOnly = getWatchOnlyAccounts()
      const merged = [
        ...entries,
        ...watchOnly.map((entry) => ({
          name: entry.name,
          identity: entry.identity,
          watchOnly: true,
        })),
      ]
      setAccounts(merged)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      setStatus(error instanceof Error ? error.message : t('accounts.manage.errors.load'))
    }
  }

  const setActive = (identity: string, name: string) => {
    setOnboarded(identity, name)
  }

  const persistOrder = (next: AccountEntry[]) => {
    const identities = next.map((account) => account.identity)
    saveAccountOrder(identities)
    setAccounts(next)
  }

  const handleDragStart = (identity: string) => (event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', identity)
    setDraggedId(identity)
  }

  const handleDragOver = (identity: string) => (event: React.DragEvent) => {
    event.preventDefault()
    setDragOverId(identity)
  }

  const handleDrop = (identity: string) => (event: React.DragEvent) => {
    event.preventDefault()
    const sourceId = draggedId || event.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === identity) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    const sourceIndex = orderedAccounts.findIndex((account) => account.identity === sourceId)
    const targetIndex = orderedAccounts.findIndex((account) => account.identity === identity)
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    const next = [...orderedAccounts]
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, moved)
    persistOrder(next)
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleRemove = async (account: AccountEntry, passphrase: string) => {
    setStatus(null)
    setLoading(true)
    try {
      if (account.watchOnly) {
        const watchOnly = getWatchOnlyAccounts().filter(
          (entry) => entry.identity !== account.identity,
        )
        saveWatchOnlyAccounts(watchOnly)
      } else {
        const vault = await openBrowserVault(passphrase, false)
        await vault.remove(account.identity)
        await vault.save()
      }
      const remaining = orderedAccounts.filter((entry) => entry.identity !== account.identity)
      persistOrder(remaining)
      saveCachedAccounts(remaining.filter((entry) => !entry.watchOnly))
      setLoading(false)
      if (remaining.length === 0) {
        clearOnboarded()
        navigate('/')
      } else if (account.identity === currentIdentity) {
        setOnboarded(remaining[0].identity, remaining[0].name)
      }
    } catch (error) {
      setLoading(false)
      setStatus(error instanceof Error ? error.message : t('accounts.manage.errors.remove'))
    }
  }

  const handleRename = async (account: AccountEntry, name: string, passphrase: string) => {
    if (!name.trim()) {
      setStatus(t('accounts.manage.errors.nameRequired'))
      return
    }
    setStatus(null)
    setLoading(true)
    try {
      if (account.watchOnly) {
        const watchOnly = getWatchOnlyAccounts().map((entry) =>
          entry.identity === account.identity ? { ...entry, name: name.trim() } : entry,
        )
        saveWatchOnlyAccounts(watchOnly)
      } else {
        const vault = await openBrowserVault(passphrase, false)
        const seed = await vault.getSeed(account.identity)
        await vault.remove(account.identity)
        await vault.addSeed({ name: name.trim(), seed, overwrite: true })
        await vault.save()
        if (account.identity === currentIdentity) {
          setOnboarded(account.identity, name.trim())
        }
      }
      const updated = orderedAccounts.map((entry) =>
        entry.identity === account.identity ? { ...entry, name: name.trim() } : entry,
      )
      saveCachedAccounts(updated.filter((entry) => !entry.watchOnly))
      setAccounts(updated)
      setRenameTarget(null)
      setRenameValue('')
      setRenameError('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('accounts.manage.errors.rename'))
    } finally {
      setLoading(false)
    }
  }

  const handleRevealSeed = async (account: AccountEntry, passphrase: string) => {
    if (account.watchOnly) {
      setStatus(t('accounts.manage.errors.watchOnlySeed'))
      return
    }
    setStatus(null)
    setLoading(true)
    try {
      const vault = await openBrowserVault(passphrase, false)
      const seed = await vault.getSeed(account.identity)
      setSeedTarget(account)
      setRevealedSeed(seed)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('accounts.manage.errors.reveal'))
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPassphrase = (action: NonNullable<typeof pendingAction>) => {
    setPendingAction(action)
    setPassphraseInput('')
    setPassphraseError('')
    setPassphrasePromptOpen(true)
  }

  const handlePassphraseSubmit = async () => {
    if (!passphraseInput.trim()) {
      setPassphraseError(t('accounts.manage.errors.passphraseRequired'))
      return
    }
    const passphrase = passphraseInput.trim()
    try {
      const vault = await openBrowserVault(passphrase, false)
      const cached = getCachedAccounts()
      const currentIdentity = localStorage.getItem('currentIdentity')
      const expectedIdentity = currentIdentity ?? cached[0]?.identity
      if (expectedIdentity) {
        await vault.getSeed(expectedIdentity)
      }
      setVaultPassphrase(passphrase)
      setPassphrasePromptOpen(false)
      setPassphraseInput('')
      setPassphraseError('')
      if (!pendingAction) return
      const action = pendingAction
      setPendingAction(null)
      if (action.type === 'load') {
        await loadAccounts(passphrase)
        return
      }
      if (action.type === 'remove') {
        await handleRemove(action.account, passphrase)
        return
      }
      if (action.type === 'reveal') {
        await handleRevealSeed(action.account, passphrase)
        return
      }
      if (action.type === 'rename') {
        await handleRename(action.account, action.name, passphrase)
      }
    } catch (error) {
      if (
        error instanceof VaultInvalidPassphraseError ||
        error instanceof VaultEntryNotFoundError
      ) {
        setPassphraseError(t('accounts.manage.errors.invalidPassphrase'))
        return
      }
      setPassphraseError(t('accounts.manage.errors.invalidPassphrase'))
    }
  }

  return (
    <section className="flex min-h-full w-full justify-center pb-6 pt-4">
      <div className="flex w-full flex-col gap-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">{t('accounts.manage.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('accounts.manage.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-2">
          {orderedAccounts.map((account) => {
            const balance = balanceByIdentity.get(account.identity)
            const isActive = account.identity === currentIdentity
            const isDragging = draggedId === account.identity
            const isOver = dragOverId === account.identity
            return (
              <button
                key={account.identity}
                type="button"
                draggable
                onDragStart={handleDragStart(account.identity)}
                onDragOver={handleDragOver(account.identity)}
                onDrop={handleDrop(account.identity)}
                onDragEnd={handleDragEnd}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setRenameTarget(account)
                    setRenameValue(account.name)
                    setRenameError('')
                  }
                }}
                aria-label={`${t('accounts.manage.menu')} ${account.name}`}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2 ${
                  isOver ? 'ring-2 ring-primary/40' : ''
                } ${isDragging ? 'opacity-60' : ''}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/30">
                    <WalletIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {account.name}
                      </span>
                      {account.watchOnly && (
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {t('accounts.manage.watchOnly')}
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {t('accounts.manage.active')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">
                        {truncateString(account.identity, { leading: 5, trailing: 5 })}
                      </span>
                      <span className="text-[11px] font-semibold text-foreground">
                        {balance ? formatBalanceCompact(balance) : '--'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" aria-label={t('accounts.manage.drag')}>
                    <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label={t('accounts.manage.menu')}>
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setActive(account.identity, account.name)}>
                        <CheckIcon className="h-4 w-4" />
                        {t('accounts.manage.select')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameTarget(account)
                          setRenameValue(account.name)
                          setRenameError('')
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                        {t('accounts.manage.rename')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (account.watchOnly) {
                            handleRevealSeed(account, '')
                            return
                          }
                          if (!vaultPassphrase) {
                            handleRequestPassphrase({ type: 'reveal', account })
                            return
                          }
                          handleRevealSeed(account, vaultPassphrase)
                        }}
                      >
                        <ShieldCheckIcon className="h-4 w-4" />
                        {t('accounts.manage.reveal')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setRemoveTarget(account)}
                      >
                        <TrashIcon className="h-4 w-4" />
                        {t('accounts.manage.remove')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </button>
            )
          })}
          {orderedAccounts.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
              {t('accounts.manage.empty')}
            </div>
          )}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-3 text-left text-sm text-muted-foreground transition hover:bg-muted/20"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/30 text-muted-foreground">
              <PlusIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {t('accounts.manage.addTitle')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('accounts.manage.addNewDesc')}
              </span>
            </div>
          </button>
          {status && <p className="text-xs text-destructive">{status}</p>}
        </div>
      </div>

      <Drawer open={addOpen} onOpenChange={setAddOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('accounts.manage.addTitle')}</DrawerTitle>
            <DrawerDescription>{t('accounts.manage.addNewDesc')}</DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-3 px-4 pb-2">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setAddOpen(false)
                navigate('/accounts/create')
              }}
            >
              <PlusCircleIcon className="h-5 w-5" />
              {t('accounts.manage.addCreate')}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setAddOpen(false)
                navigate('/accounts/import-seed')
              }}
            >
              <KeyRoundIcon className="h-5 w-5" />
              {t('accounts.manage.addImport')}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setAddOpen(false)
                navigate('/accounts/watch-only')
              }}
            >
              <UploadIcon className="h-5 w-5" />
              {t('accounts.manage.watchOnlyAdd')}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null)
            setRenameError('')
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('accounts.manage.renameTitle')}</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2 px-4">
            <Label htmlFor="rename-input">{t('accounts.manage.renameLabel')}</Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(event) => {
                setRenameValue(event.target.value)
                if (renameError) {
                  setRenameError('')
                }
              }}
            />
            {renameError && <p className="text-xs text-destructive">{renameError}</p>}
          </div>
          <DrawerFooter>
            <Button
              onClick={() => {
                if (!renameTarget) return
                const name = renameValue.trim()
                const hasNameConflict = accounts.some(
                  (entry) =>
                    entry.identity !== renameTarget.identity &&
                    entry.name.toLowerCase() === name.toLowerCase(),
                )
                if (hasNameConflict) {
                  setRenameError(t('accounts.manage.errors.nameDuplicate'))
                  return
                }
                setRenameError('')
                if (renameTarget.watchOnly) {
                  handleRename(renameTarget, name, '')
                  return
                }
                if (!vaultPassphrase) {
                  setRenameTarget(null)
                  handleRequestPassphrase({ type: 'rename', account: renameTarget, name })
                  return
                }
                handleRename(renameTarget, name, vaultPassphrase)
              }}
              disabled={!renameValue.trim() || loading}
            >
              <CheckIcon className="h-4 w-4" />
              {t('accounts.manage.save')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={Boolean(seedTarget)}
        onOpenChange={() => {
          setSeedTarget(null)
          setRevealedSeed('')
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('accounts.manage.revealTitle')}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            <Textarea value={revealedSeed} rows={3} readOnly className="resize-none" />
          </div>
          <DrawerFooter>
            <Button
              variant="outline"
              onClick={async () => {
                if (!revealedSeed) return
                await navigator.clipboard.writeText(revealedSeed)
              }}
            >
              <CopyIcon className="h-4 w-4" />
              {t('accounts.manage.copySeed')}
            </Button>
            <DrawerClose asChild>
              <Button>
                <CheckIcon className="h-4 w-4" />
                {t('accounts.manage.done')}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={Boolean(removeTarget)} onOpenChange={() => setRemoveTarget(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('accounts.manage.removeTitle')}</DrawerTitle>
            <DrawerDescription>{t('accounts.manage.removeDesc')}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTarget) {
                  if (removeTarget.watchOnly) {
                    handleRemove(removeTarget, '')
                    setRemoveTarget(null)
                    return
                  }
                  if (!vaultPassphrase) {
                    handleRequestPassphrase({ type: 'remove', account: removeTarget })
                    setRemoveTarget(null)
                    return
                  }
                  handleRemove(removeTarget, vaultPassphrase)
                  setRemoveTarget(null)
                }
              }}
            >
              <TrashIcon className="h-4 w-4" />
              {t('accounts.manage.remove')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={passphrasePromptOpen} onOpenChange={setPassphrasePromptOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('accounts.manage.passphraseTitle')}</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2 px-4">
            <Label htmlFor="vault-passphrase">{t('accounts.manage.passphrase')}</Label>
            <Input
              id="vault-passphrase"
              type="password"
              value={passphraseInput}
              onChange={(event) => setPassphraseInput(event.target.value)}
            />
            {passphraseError && <p className="text-xs text-destructive">{passphraseError}</p>}
          </div>
          <DrawerFooter>
            <Button onClick={handlePassphraseSubmit}>
              <CheckIcon className="h-4 w-4" />
              {t('accounts.manage.confirm')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </section>
  )
}

export default ManageAccounts
