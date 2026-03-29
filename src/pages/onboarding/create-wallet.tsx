import { useEffect, useMemo, useState } from 'react'
import { identityFromSeed } from '@qubic-labs/core'
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { generateSeed, isSeedLike } from '@/lib/seed'
import { setUnlocked } from '@/lib/lock'
import {
  openBrowserVault,
  setOnboarded,
  validateVaultPassphrase,
  verifyVaultAccess,
} from '@/lib/vault'
import {
  getCachedAccounts,
  getSuggestedNextAccountName,
  isAccountNameTaken,
  saveCachedAccounts,
} from '@/lib/accounts'
import SeedSecurityStep from '@/components/onboarding/seed-security-step'
import PassphraseStep from '@/components/onboarding/passphrase-step'
import FlowHeader from '@/components/onboarding/flow-header'

const TOTAL_STEPS = 3

type CreateWalletProps = {
  onCancelPath?: string
  onCompletePath?: string
  variant?: 'onboarding' | 'add-address'
}

const CreateWallet = ({
  onCancelPath = '/',
  onCompletePath = '/home',
  variant = 'onboarding',
}: CreateWalletProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [seed, setSeed] = useState(() => generateSeed())
  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [name, setName] = useState(() =>
    getSuggestedNextAccountName({
      enableAutoName: variant === 'add-address',
      prefix: t('accounts.manage.defaultNamePrefix'),
      fallbackName: 'main',
    }),
  )
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [identity, setIdentity] = useState<string>('')
  const [hasConfirmedSeedBackup, setHasConfirmedSeedBackup] = useState(false)

  const progressValue = useMemo(() => (step / TOTAL_STEPS) * 100, [step])

  const clearSensitiveState = () => {
    setSeed('')
    setPassphrase('')
    setConfirmPassphrase('')
    setHasConfirmedSeedBackup(false)
  }

  useEffect(() => {
    let isActive = true

    const resolveIdentity = async () => {
      try {
        const derived = await identityFromSeed(seed)
        if (isActive) {
          setIdentity(derived)
        }
      } catch {
        if (isActive) {
          setIdentity('')
        }
      }
    }

    resolveIdentity()

    return () => {
      isActive = false
    }
  }, [seed])

  const regenerate = () => {
    setSeed(generateSeed())
    setStatus(null)
    setHasConfirmedSeedBackup(false)
  }

  const handleNext = async () => {
    setStatus(null)

    if (step === 1 && !isSeedLike(seed)) {
      setStatus(t('onboarding.errors.seedInvalid'))
      return
    }

    if (step === 1 && !hasConfirmedSeedBackup) {
      setStatus(t('onboarding.errors.seedConfirmRequired'))
      return
    }

    if (step === 1 && variant === 'add-address') {
      const cachedAccounts = getCachedAccounts()
      if (cachedAccounts.some((entry) => entry.identity === identity)) {
        setStatus(t('onboarding.errors.addressExists'))
        return
      }
    }

    if (step === 2 && !passphrase.trim()) {
      setStatus(t('onboarding.errors.passphraseRequired'))
      return
    }
    if (step === 2 && variant !== 'add-address') {
      if (!confirmPassphrase.trim()) {
        setStatus(t('onboarding.errors.passphraseReenter'))
        return
      }
      if (passphrase !== confirmPassphrase) {
        setStatus(t('onboarding.errors.passphraseMismatch'))
        return
      }
      if (passphrase.length < 12) {
        setStatus(t('onboarding.errors.passphraseTooShort'))
        return
      }
    }
    if (step === 2 && variant === 'add-address') {
      if (isAccountNameTaken(name)) {
        setStatus(t('accounts.manage.errors.nameDuplicate'))
        return
      }
      const result = await validateVaultPassphrase(passphrase.trim())
      if (!result.valid) {
        setStatus(
          result.reason === 'invalid'
            ? t('onboarding.errors.invalidVaultPassphrase')
            : t('onboarding.errors.vaultValidationFailed'),
        )
        return
      }
    }

    setStep((current) => Math.min(current + 1, TOTAL_STEPS))
  }

  const handleBack = () => {
    setStatus(null)
    if (step === 1) {
      clearSensitiveState()
      navigate(onCancelPath)
      return
    }
    setStep((current) => Math.max(current - 1, 1))
  }

  const handleCreate = async () => {
    setStatus(null)

    if (!isSeedLike(seed)) {
      setStatus(t('onboarding.errors.seedInvalid'))
      setStep(1)
      return
    }

    if (!passphrase.trim()) {
      setStatus(t('onboarding.errors.passphraseRequired'))
      setStep(2)
      return
    }
    if (variant !== 'add-address') {
      if (!confirmPassphrase.trim()) {
        setStatus(t('onboarding.errors.passphraseReenter'))
        setStep(2)
        return
      }
      if (passphrase !== confirmPassphrase) {
        setStatus(t('onboarding.errors.passphraseMismatch'))
        setStep(2)
        return
      }
      if (passphrase.length < 12) {
        setStatus(t('onboarding.errors.passphraseTooShort'))
        setStep(2)
        return
      }
    }

    const cachedAccounts = getCachedAccounts()
    if (isAccountNameTaken(name)) {
      setStatus(t('accounts.manage.errors.nameDuplicate'))
      setStep(2)
      return
    }
    if (cachedAccounts.some((entry) => entry.identity === identity)) {
      setStatus(t('onboarding.errors.addressExists'))
      setStep(1)
      return
    }

    try {
      setIsSaving(true)
      const vault = await openBrowserVault(passphrase, variant !== 'add-address')
      if (variant === 'add-address') {
        const check = await verifyVaultAccess(vault)
        if (!check.valid) {
          setStatus(t('onboarding.errors.invalidVaultPassphrase'))
          setIsSaving(false)
          return
        }
      }
      const entry = await vault.addSeed({ name, seed, overwrite: true })
      await vault.save()
      const existing = getCachedAccounts().filter((item) => item.identity !== entry.identity)
      saveCachedAccounts([...existing, { name: entry.name, identity: entry.identity }])
      if (variant !== 'add-address') {
        setUnlocked()
      }
      setOnboarded(entry.identity, entry.name)
      clearSensitiveState()
      navigate(onCompletePath)
    } catch {
      setStatus(t('onboarding.errors.createFailed'))
      setIsSaving(false)
    }
  }

  return (
    <section className="flex h-full w-full justify-center px-6 py-8">
      <div className="flex w-full max-w-sm flex-col justify-between gap-6">
        <div className="space-y-3 text-center">
          <FlowHeader
            title={
              variant === 'add-address'
                ? t('onboarding.create.titleAddAddress')
                : t('onboarding.create.title')
            }
            stepLabel={t('common.step', { current: step, total: TOTAL_STEPS })}
            progressValue={progressValue}
          />
        </div>

        <div className="flex-1 space-y-4">
          {step === 1 && (
            <SeedSecurityStep
              variant={variant}
              seed={seed}
              identity={identity}
              hasConfirmedSeedBackup={hasConfirmedSeedBackup}
              onGenerate={regenerate}
              onConfirmChange={setHasConfirmedSeedBackup}
            />
          )}

          {step === 2 && (
            <PassphraseStep
              variant={variant}
              name={name}
              passphrase={passphrase}
              confirmPassphrase={confirmPassphrase}
              onNameChange={setName}
              onPassphraseChange={setPassphrase}
              onConfirmPassphraseChange={setConfirmPassphrase}
            />
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{t('onboarding.create.readyTitle')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.create.readySubtitle')}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {variant === 'add-address' ? t('common.addressLabel') : t('common.accountName')}
                  </span>
                  <span className="text-foreground">{name || 'main'}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('common.seedLength', { length: seed.length })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('common.identity')}:
                  <div className="mt-1 break-all text-foreground">{identity || '...'}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t('onboarding.create.seedWarning')}</p>
            </div>
          )}

          {status && <p className="text-xs text-destructive">{status}</p>}
        </div>

        <div className="flex w-full gap-3">
          <Button size="lg" variant="ghost" onClick={handleBack} className="flex-1">
            <ArrowLeftIcon className="h-5 w-5" />
            {step === 1 ? t('common.back') : t('common.previous')}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button size="lg" onClick={handleNext} className="flex-1">
              {t('common.continue')}
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" onClick={handleCreate} className="flex-1" disabled={isSaving}>
              <CheckCircleIcon className="h-5 w-5" />
              {variant === 'add-address'
                ? isSaving
                  ? t('onboarding.create.adding')
                  : t('onboarding.create.addAddress')
                : isSaving
                  ? t('onboarding.create.creating')
                  : t('onboarding.create.createWallet')}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

export default CreateWallet
