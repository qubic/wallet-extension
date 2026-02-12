import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { VaultInvalidPassphraseError } from '@qubic-labs/sdk'
import { ArrowLeftIcon, CheckIcon, ChevronRightIcon, KeyRoundIcon, TrashIcon } from 'lucide-react'
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getLockTimeoutMinutes, lockWallet, setLockTimeoutMinutes } from '@/lib/lock'
import { changeVaultPassphrase } from '@/lib/vault-password'

const Security = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [lockMinutes, setLockMinutes] = useState(() => getLockTimeoutMinutes())

  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [currentPassphrase, setCurrentPassphrase] = useState('')
  const [newPassphrase, setNewPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [changePasswordError, setChangePasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [resetAppOpen, setResetAppOpen] = useState(false)

  useEffect(() => {
    setLockMinutes(getLockTimeoutMinutes())
  }, [])

  const handleTimeoutChange = (value: string) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) {
      setLockMinutes(0)
      return
    }
    setLockMinutes(parsed)
    if (parsed > 0) {
      setLockTimeoutMinutes(parsed)
    }
  }

  const resetChangePasswordForm = () => {
    setCurrentPassphrase('')
    setNewPassphrase('')
    setConfirmPassphrase('')
    setChangePasswordError('')
    setChangingPassword(false)
  }

  const handleChangePassword = async () => {
    if (!currentPassphrase.trim()) {
      setChangePasswordError(t('settings.security.errors.currentRequired'))
      return
    }
    if (!newPassphrase.trim()) {
      setChangePasswordError(t('settings.security.errors.newRequired'))
      return
    }
    if (newPassphrase.length < 12) {
      setChangePasswordError(t('settings.security.errors.tooShort'))
      return
    }
    if (!confirmPassphrase.trim()) {
      setChangePasswordError(t('settings.security.errors.confirmRequired'))
      return
    }
    if (newPassphrase !== confirmPassphrase) {
      setChangePasswordError(t('settings.security.errors.mismatch'))
      return
    }

    setChangingPassword(true)
    setChangePasswordError('')

    try {
      await changeVaultPassphrase(currentPassphrase, newPassphrase)
      setChangePasswordOpen(false)
      resetChangePasswordForm()
      lockWallet()
      navigate('/unlock')
    } catch (error) {
      if (error instanceof VaultInvalidPassphraseError) {
        setChangePasswordError(t('settings.security.errors.invalidCurrent'))
      } else {
        setChangePasswordError(t('settings.security.errors.changeFailed'))
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const handleResetApp = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <>
      <section className="flex w-full justify-center pt-4">
        <div className="flex w-full max-w-sm flex-col gap-6 px-6">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t('settings.security.back')}
          </button>

          <h2 className="text-base font-semibold">{t('settings.security.title')}</h2>

          <button
            type="button"
            onClick={() => setChangePasswordOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card/80 px-3 py-3 text-left transition hover:bg-muted/20"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/30">
              <KeyRoundIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold text-foreground">
                {t('settings.security.changePassword')}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t('settings.security.changePasswordDesc')}
              </span>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="space-y-3">
            <Label htmlFor="lock-timeout" className="text-sm text-muted-foreground">
              {t('settings.lockTimeout.label')}
            </Label>
            <Input
              id="lock-timeout"
              type="number"
              min={1}
              max={120}
              value={Number.isFinite(lockMinutes) ? lockMinutes : ''}
              onChange={(event) => handleTimeoutChange(event.target.value)}
              onBlur={() => {
                if (lockMinutes <= 0) {
                  setLockMinutes(getLockTimeoutMinutes())
                }
              }}
            />
            <p className="text-xs text-muted-foreground">{t('settings.lockTimeout.helper')}</p>
          </div>

          <Separator />

          <Button variant="destructive" onClick={() => setResetAppOpen(true)}>
            <TrashIcon className="h-4 w-4" />
            {t('settings.security.resetApp')}
          </Button>
        </div>
      </section>

      <Drawer
        open={changePasswordOpen}
        onOpenChange={(open) => {
          setChangePasswordOpen(open)
          if (!open) {
            resetChangePasswordForm()
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('settings.security.changePasswordDrawerTitle')}</DrawerTitle>
            <DrawerDescription>{t('settings.security.changePasswordDrawerDesc')}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 px-4">
            <div className="space-y-2">
              <Label htmlFor="current-passphrase">{t('settings.security.currentPassphrase')}</Label>
              <Input
                id="current-passphrase"
                type="password"
                value={currentPassphrase}
                onChange={(event) => {
                  setCurrentPassphrase(event.target.value)
                  if (changePasswordError) setChangePasswordError('')
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-passphrase">{t('settings.security.newPassphrase')}</Label>
              <Input
                id="new-passphrase"
                type="password"
                value={newPassphrase}
                onChange={(event) => {
                  setNewPassphrase(event.target.value)
                  if (changePasswordError) setChangePasswordError('')
                }}
              />
              <p className="text-xs text-muted-foreground">{t('settings.security.minChars')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-passphrase">{t('settings.security.confirmPassphrase')}</Label>
              <Input
                id="confirm-passphrase"
                type="password"
                value={confirmPassphrase}
                onChange={(event) => {
                  setConfirmPassphrase(event.target.value)
                  if (changePasswordError) setChangePasswordError('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !changingPassword) {
                    handleChangePassword()
                  }
                }}
              />
            </div>
            {changePasswordError && (
              <p className="text-xs text-destructive">{changePasswordError}</p>
            )}
          </div>
          <DrawerFooter>
            <Button
              onClick={handleChangePassword}
              disabled={
                changingPassword ||
                !currentPassphrase.trim() ||
                !newPassphrase.trim() ||
                !confirmPassphrase.trim()
              }
            >
              <CheckIcon className="h-4 w-4" />
              {changingPassword ? t('settings.security.saving') : t('settings.security.save')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={resetAppOpen} onOpenChange={setResetAppOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.security.resetAppTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.security.resetAppDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('settings.security.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleResetApp}>
              {t('settings.security.resetAppConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default Security
