import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EyeIcon, EyeOffIcon, LockOpenIcon, ShieldCheckIcon } from 'lucide-react'
import { VaultEntryNotFoundError, VaultInvalidPassphraseError } from '@qubic-labs/sdk'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { setUnlocked } from '@/lib/lock'
import { openBrowserVault } from '@/lib/vault'
import { truncateString } from '@/lib/utils'

const Unlock = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const currentIdentity = localStorage.getItem('currentIdentity') ?? ''

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
    <section className="flex min-h-full w-full justify-center">
      <div className="flex min-h-full w-full max-w-sm flex-col px-4 pb-6 pt-4">
        <div className="flex items-center justify-end">
          {currentIdentity && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {truncateString(currentIdentity)}
            </span>
          )}
        </div>

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
          <InputGroup className="h-12">
            <InputGroupInput
              id="passphrase"
              type={showPassphrase ? 'text' : 'password'}
              placeholder={t('passphraseAuth.form.passphrasePlaceholder')}
              value={passphrase}
              onChange={(e) => handlePassphraseChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={Boolean(error)}
              className="h-12 text-base"
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
          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">{t('passphraseAuth.securityNote')}</p>
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
  )
}

export default Unlock
