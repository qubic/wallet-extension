import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { useSdk } from '@qubic-labs/react'
import { VaultInvalidPassphraseError, VaultEntryNotFoundError } from '@qubic-labs/sdk'
import { ArrowLeftIcon, PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getAccountOrder,
  getCachedAccounts,
  getCurrentIdentity,
  getWatchOnlyAccounts,
  isAccountNameTaken,
  saveAccountOrder,
  saveCachedAccounts,
  saveWatchOnlyAccounts,
} from '@/lib/accounts'
import { clearOnboarded, openBrowserVault, setOnboarded } from '@/lib/vault'
import AccountListItem from '@/components/pages/manage-accounts/account-list-item'
import AddAccountDrawer from '@/components/pages/manage-accounts/add-account-drawer'
import RenameAccountDrawer from '@/components/pages/manage-accounts/rename-account-drawer'
import RevealSeedDrawer from '@/components/pages/manage-accounts/reveal-seed-drawer'
import RemoveAccountDrawer from '@/components/pages/manage-accounts/remove-account-drawer'
import PassphrasePromptDrawer from '@/components/pages/manage-accounts/passphrase-prompt-drawer'
import type { AccountEntry } from '@/components/pages/manage-accounts/types'

const ManageAccounts = () => {
  const { t } = useTranslation()
  const sdk = useSdk()
  const navigate = useNavigate()
  const location = useLocation()
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
  const [currentIdentity, setCurrentIdentity] = useState(getCurrentIdentity())
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [renameTarget, setRenameTarget] = useState<AccountEntry | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState('')
  const [seedTarget, setSeedTarget] = useState<AccountEntry | null>(null)
  const [revealedSeed, setRevealedSeed] = useState('')
  const [removeTarget, setRemoveTarget] = useState<AccountEntry | null>(null)
  const [addOpen, setAddOpen] = useState(false)
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
    const state = location.state as { openAdd?: boolean } | null
    if (state?.openAdd) {
      setAddOpen(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    const refreshCurrentIdentity = () => {
      setCurrentIdentity(getCurrentIdentity())
    }
    window.addEventListener('storage', refreshCurrentIdentity)
    window.addEventListener('wallet-account-updated', refreshCurrentIdentity)
    return () => {
      window.removeEventListener('storage', refreshCurrentIdentity)
      window.removeEventListener('wallet-account-updated', refreshCurrentIdentity)
    }
  }, [])

  useEffect(() => {
    const handleStorage = () => refreshFromCache()
    window.addEventListener('storage', handleStorage)
    window.addEventListener('wallet-account-updated', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('wallet-account-updated', handleStorage)
    }
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

  const canRemoveAnyAccount = orderedAccounts.length > 1

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
    navigate('/home')
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
    if (orderedAccounts.length <= 1) {
      setStatus(t('accounts.manage.errors.lastAccount'))
      return
    }

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
        saveAccountOrder([])
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
        // Write first with overwrite to avoid losing the existing entry if an intermediate step fails.
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
      const expectedIdentity = vault.list()[0]?.identity
      if (expectedIdentity) {
        await vault.getSeed(expectedIdentity)
      }
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
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('settings.general.back')}
        </button>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">{t('accounts.manage.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('accounts.manage.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/20"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {orderedAccounts.map((account) => {
            const balance = balanceByIdentity.get(account.identity)
            const isActive = account.identity === currentIdentity
            const isDragging = draggedId === account.identity
            const isOver = dragOverId === account.identity
            return (
              <AccountListItem
                key={account.identity}
                account={account}
                balance={balance}
                isActive={isActive}
                isDragging={isDragging}
                isOver={isOver}
                canRemoveAnyAccount={canRemoveAnyAccount}
                onDragStart={handleDragStart(account.identity)}
                onDragOver={handleDragOver(account.identity)}
                onDrop={handleDrop(account.identity)}
                onDragEnd={handleDragEnd}
                onRequestRename={(item) => {
                  setRenameTarget(item)
                  setRenameValue(item.name)
                  setRenameError('')
                }}
                onSelect={(item) => setActive(item.identity, item.name)}
                onReveal={(item) => {
                  handleRequestPassphrase({ type: 'reveal', account: item })
                }}
                onRemove={(item) => setRemoveTarget(item)}
              />
            )
          })}
          {orderedAccounts.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
              {t('accounts.manage.empty')}
            </div>
          )}
          {status && <p className="text-xs text-destructive">{status}</p>}
        </div>
      </div>

      <AddAccountDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreate={() => {
          setAddOpen(false)
          navigate('/accounts/create')
        }}
        onImportSeed={() => {
          setAddOpen(false)
          navigate('/accounts/import-seed')
        }}
        onWatchOnly={() => {
          setAddOpen(false)
          navigate('/accounts/watch-only')
        }}
      />

      <RenameAccountDrawer
        open={Boolean(renameTarget)}
        target={renameTarget}
        value={renameValue}
        error={renameError}
        loading={loading}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null)
            setRenameError('')
          }
        }}
        onValueChange={(value) => {
          setRenameValue(value)
          if (renameError) {
            setRenameError('')
          }
        }}
        onSubmit={() => {
          if (!renameTarget) return
          const name = renameValue.trim()
          if (
            isAccountNameTaken(name, {
              excludeIdentity: renameTarget.identity,
              entries: accounts,
            })
          ) {
            setRenameError(t('accounts.manage.errors.nameDuplicate'))
            return
          }
          setRenameError('')
          if (renameTarget.watchOnly) {
            handleRename(renameTarget, name, '')
            return
          }
          setRenameTarget(null)
          handleRequestPassphrase({ type: 'rename', account: renameTarget, name })
        }}
      />

      <RevealSeedDrawer
        open={Boolean(seedTarget)}
        seed={revealedSeed}
        onOpenChange={(open) => {
          if (!open) {
            setSeedTarget(null)
            setRevealedSeed('')
          }
        }}
        onCopy={async () => {
          if (!revealedSeed) return
          await navigator.clipboard.writeText(revealedSeed)
        }}
      />

      <RemoveAccountDrawer
        open={Boolean(removeTarget)}
        canRemoveAnyAccount={canRemoveAnyAccount}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null)
          }
        }}
        onConfirm={() => {
          if (!removeTarget) return
          if (removeTarget.watchOnly) {
            handleRemove(removeTarget, '')
            setRemoveTarget(null)
            return
          }
          handleRequestPassphrase({ type: 'remove', account: removeTarget })
          setRemoveTarget(null)
        }}
      />

      <PassphrasePromptDrawer
        open={passphrasePromptOpen}
        passphrase={passphraseInput}
        error={passphraseError}
        onOpenChange={(open) => {
          setPassphrasePromptOpen(open)
          if (!open) {
            setPassphraseInput('')
            setPassphraseError('')
            setPendingAction(null)
          }
        }}
        onPassphraseChange={setPassphraseInput}
        onSubmit={handlePassphraseSubmit}
      />
    </section>
  )
}

export default ManageAccounts
