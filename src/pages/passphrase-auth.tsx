import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LockOpenIcon, ShieldCheckIcon } from 'lucide-react'
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
import { PasswordInput } from '@/components/ui/password-input'

import { setUnlocked } from '@/lib/lock'
import { openBrowserVault, verifyVaultAccess } from '@/lib/vault'

type PassphraseAuthProps = {
  open?: boolean
  identity?: string
  title?: string
  subtitle?: string
  onSuccess: (seed: string) => void
  onCancel: () => void
}

const PassphraseAuth = ({
  open = true,
  identity,
  title,
  subtitle,
  onSuccess,
  onCancel,
}: PassphraseAuthProps) => {
  const { t } = useTranslation()
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    if (!passphrase.trim()) {
      setError(t('passphraseAuth.validation.required'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const vault = await openBrowserVault(passphrase, false)
      const access = await verifyVaultAccess(vault)
      if (!access.valid) {
        setError(
          access.reason === 'invalid'
            ? t('passphraseAuth.errors.invalidPassphrase')
            : t('passphraseAuth.errors.generic'),
        )
        return
      }

      const seedIdentity = identity ?? vault.list()[0]?.identity
      if (!seedIdentity) {
        setError(t('passphraseAuth.errors.accountNotFound'))
        return
      }
      const seed = await vault.getSeed(seedIdentity)

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
        </DrawerHeader>

        <div className="space-y-3 px-4 pb-2">
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
