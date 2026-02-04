import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, LockIcon, ShieldCheckIcon } from 'lucide-react'
import { VaultInvalidPassphraseError, VaultEntryNotFoundError } from '@qubic-labs/sdk'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { setUnlocked } from '@/lib/lock'
import { openBrowserVault } from '@/lib/vault'

type PassphraseAuthProps = {
  title?: string
  subtitle?: string
  onSuccess: (seed: string) => void
  onCancel: () => void
}

const PassphraseAuth = ({ title, subtitle, onSuccess, onCancel }: PassphraseAuthProps) => {
  const { t } = useTranslation()
  const currentAccountName = localStorage.getItem('currentAccountName') ?? 'Main account'

  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)

  const handleSubmit = async () => {
    if (!passphrase.trim()) {
      setError(t('passphraseAuth.validation.required'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const vault = await openBrowserVault(passphrase, false)
      const seed = await vault.getSeed(currentAccountName)

      setUnlocked()
      setPassphrase('')
      onSuccess(seed)
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
    <section className="flex min-h-full w-full justify-center">
      <div className="flex min-h-full w-full max-w-sm flex-col px-6 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t('passphraseAuth.actions.back')}
          </button>
          <img src="/branding/Qubic-Logo-White.svg" alt="Qubic" className="h-5 opacity-80" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheckIcon className="h-8 w-8 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">{title ?? t('passphraseAuth.title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {subtitle ?? t('passphraseAuth.subtitle')}
            </p>
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="passphrase">{t('passphraseAuth.form.passphrase')}</Label>
              <InputGroup>
                <InputGroupInput
                  id="passphrase"
                  type={showPassphrase ? 'text' : 'password'}
                  placeholder={t('passphraseAuth.form.passphrasePlaceholder')}
                  value={passphrase}
                  onChange={(e) => handlePassphraseChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-invalid={Boolean(error)}
                  autoFocus
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    variant="ghost"
                    aria-label={
                      showPassphrase
                        ? t('passphraseAuth.form.hidePassphrase')
                        : t('passphraseAuth.form.showPassphrase')
                    }
                    onClick={() => setShowPassphrase((current) => !current)}
                  >
                    {showPassphrase ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-left">
              <div className="flex items-center gap-3">
                <LockIcon className="mt-0.5 h-10 w-10 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{t('passphraseAuth.securityNote')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-3 pt-6">
          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={loading}
          >
            {t('passphraseAuth.actions.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            size="lg"
            className="flex-1"
            disabled={loading || !passphrase.trim()}
          >
            {loading ? t('passphraseAuth.actions.unlocking') : t('passphraseAuth.actions.unlock')}
          </Button>
        </div>
      </div>
    </section>
  )
}

export default PassphraseAuth
