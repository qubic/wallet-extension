import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LockOpenIcon, ShieldCheckIcon } from 'lucide-react'
import { VaultEntryNotFoundError, VaultInvalidPassphraseError } from '@qubic-labs/sdk'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { setUnlocked } from '@/lib/lock'
import { saveCachedAccounts } from '@/lib/accounts'
import { clearWalletStorage } from '@/lib/storage'
import { openBrowserVault, repairDuplicateVaultEntries } from '@/lib/vault'

const Unlock = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteWalletOpen, setDeleteWalletOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteWallet = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await clearWalletStorage()
    } catch {
      // Wipe is best-effort; reload regardless so the router re-evaluates onboarded state.
    }
    window.location.hash = '/'
    window.location.reload()
  }

  const handleSubmit = async () => {
    if (!passphrase.trim()) {
      setError(t('passphraseAuth.validation.required'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const vault = await openBrowserVault(passphrase, false)
      const identityToValidate = vault.list()[0]?.identity

      if (!identityToValidate) {
        setError(t('passphraseAuth.errors.accountNotFound'))
        return
      }

      await vault.getSeed(identityToValidate)
      const entries = await repairDuplicateVaultEntries(vault)
      saveCachedAccounts(entries)
      setUnlocked()
      setPassphrase('')
      navigate('/home')
    } catch (err) {
      if (err instanceof VaultInvalidPassphraseError) {
        setError(t('passphraseAuth.errors.invalidPassphrase'))
      } else if (err instanceof VaultEntryNotFoundError) {
        setError(t('passphraseAuth.errors.accountNotFound'))
      } else {
        setError(t('passphraseAuth.errors.generic'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePassphraseChange = (value: string) => {
    setPassphrase(value)
    if (error) {
      setError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit()
    }
  }

  return (
    <>
      <section className="flex min-h-full w-full justify-center">
        <div className="flex min-h-full w-full max-w-sm flex-col px-4 pb-6 pt-6">
          <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheckIcon className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold">{t('unlock.title')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('unlock.subtitle')}</p>
            </div>
          </div>

          <div className="mt-6 w-full space-y-3">
            <PasswordInput
              id="passphrase"
              groupClassName="h-12"
              placeholder={t('passphraseAuth.form.passphrasePlaceholder')}
              value={passphrase}
              onChange={(e) => handlePassphraseChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={Boolean(error)}
              className="h-12 text-base"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">{t('passphraseAuth.securityNote')}</p>
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setDeleteWalletOpen(true)}
                className="text-xs text-destructive/70 underline-offset-2 transition hover:text-destructive hover:underline"
              >
                {t('settings.security.resetApp')}
              </button>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full gap-2"
              disabled={loading || !passphrase.trim()}
            >
              <LockOpenIcon className="h-4 w-4" />
              {loading ? t('passphraseAuth.actions.unlocking') : t('passphraseAuth.actions.unlock')}
            </Button>
          </div>
        </div>
      </section>

      <AlertDialog open={deleteWalletOpen} onOpenChange={setDeleteWalletOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.security.resetAppTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.security.resetAppDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('settings.security.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteWallet}
              disabled={isDeleting}
            >
              {t('settings.security.resetAppConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default Unlock
