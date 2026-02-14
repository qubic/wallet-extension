import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EyeIcon, EyeOffIcon, LockOpenIcon, ShieldCheckIcon } from 'lucide-react'
import { VaultInvalidPassphraseError, VaultEntryNotFoundError } from '@qubic-labs/sdk'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { getCachedAccounts } from '@/lib/accounts'
import { setUnlocked } from '@/lib/lock'
import { openBrowserVault } from '@/lib/vault'
import { truncateString } from '@/lib/utils'

type PassphraseAuthProps = {
  open?: boolean
  title?: string
  subtitle?: string
  onSuccess: (seed: string) => void
  onCancel: () => void
}

const PassphraseAuth = ({
  open = true,
  title,
  subtitle,
  onSuccess,
  onCancel,
}: PassphraseAuthProps) => {
  const { t } = useTranslation()
  const storedIdentity = localStorage.getItem('currentIdentity')
  const currentIdentity = storedIdentity ?? getCachedAccounts()[0]?.identity ?? ''

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
      const seed = await vault.getSeed(currentIdentity)

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

  const handleCancel = () => {
    setPassphrase('')
    setError('')
    onCancel()
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) {
          handleCancel()
        }
      }}
    >
      <DrawerContent className="border-none bg-background">
        <DrawerHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheckIcon className="h-6 w-6 shrink-0 text-primary" />
          </div>
          <DrawerTitle>{title ?? t('passphraseAuth.title')}</DrawerTitle>
          <DrawerDescription>{subtitle ?? t('passphraseAuth.subtitle')}</DrawerDescription>
          {currentIdentity && (
            <div className="font-mono text-[11px] text-muted-foreground">
              {truncateString(currentIdentity)}
            </div>
          )}
        </DrawerHeader>

        <div className="space-y-3 px-4 pb-2">
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

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full gap-2"
            disabled={loading || !passphrase.trim()}
          >
            <LockOpenIcon className="h-4 w-4" />
            {loading ? t('passphraseAuth.actions.unlocking') : t('passphraseAuth.actions.unlock')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default PassphraseAuth
