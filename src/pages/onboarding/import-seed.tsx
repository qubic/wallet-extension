import { useMemo, useState } from 'react'
import { identityFromSeed } from '@qubic-labs/core'
import { ArrowLeftIcon, ArrowRightIcon, KeyRoundIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PasswordInput } from '@/components/ui/password-input'
import { isSeedLike } from '@/lib/seed'
import {
  getCachedAccounts,
  getSuggestedNextAccountName,
  isAccountNameTaken,
  saveCachedAccounts,
} from '@/lib/accounts'
import { setUnlocked } from '@/lib/lock'
import {
  openBrowserVault,
  setOnboarded,
  validateVaultPassphrase,
  verifyVaultAccess,
} from '@/lib/vault'
import FlowHeader from '@/components/onboarding/flow-header'

const TOTAL_STEPS = 3
const SEED_LENGTH = 55

const normalizeSeedInput = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, SEED_LENGTH)

type ImportSeedProps = {
  onCancelPath?: string
  onCompletePath?: string
  variant?: 'onboarding' | 'add-address'
}

const ImportSeed = ({
  onCancelPath = '/',
  onCompletePath = '/home',
  variant = 'onboarding',
}: ImportSeedProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [seed, setSeed] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [name, setName] = useState(() =>
    getSuggestedNextAccountName({
      enableAutoName: variant === 'add-address',
      prefix: t('accounts.manage.defaultNamePrefix'),
      fallbackName: 'main',
    }),
  )
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [derivedIdentity, setDerivedIdentity] = useState<string | null>(null)
  const progressValue = useMemo(() => (step / TOTAL_STEPS) * 100, [step])
  const seedLength = seed.length
  const isSeedValid = isSeedLike(seed)
  const seedValidationMessage = isSeedValid
    ? t('onboarding.importSeed.seedValid')
    : t('onboarding.importSeed.seedInvalidCount', { current: seedLength, total: SEED_LENGTH })

  const clearSensitiveState = () => {
    setSeed('')
    setPassphrase('')
    setDerivedIdentity(null)
  }

  const handleSeedChange = (value: string) => {
    setSeed(normalizeSeedInput(value))
    if (step === 1 && status) {
      setStatus(null)
    }
  }

  const handleNext = async () => {
    setStatus(null)

    if (step === 1 && !isSeedLike(seed)) {
      setStatus(t('onboarding.errors.seedInvalid'))
      return
    }

    if (step === 1 && variant === 'add-address') {
      try {
        const identity = await identityFromSeed(seed)
        setDerivedIdentity(identity)
        const cachedAccounts = getCachedAccounts()
        if (cachedAccounts.some((entry) => entry.identity === identity)) {
          setStatus(t('onboarding.errors.addressExists'))
          return
        }
      } catch {
        setStatus(t('onboarding.errors.seedInvalid'))
        return
      }
    }

    if (step === 2 && !passphrase.trim()) {
      setStatus(t('onboarding.errors.passphraseRequired'))
      return
    }
    if (step === 2 && variant !== 'add-address' && passphrase.length < 12) {
      setStatus(t('onboarding.errors.passphraseTooShort'))
      return
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

  const handleImport = async () => {
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
    if (variant !== 'add-address' && passphrase.length < 12) {
      setStatus(t('onboarding.errors.passphraseTooShort'))
      setStep(2)
      return
    }

    const cachedAccounts = getCachedAccounts()
    if (isAccountNameTaken(name)) {
      setStatus(t('accounts.manage.errors.nameDuplicate'))
      setStep(2)
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
      if (variant === 'add-address') {
        const identityToCheck = derivedIdentity ?? (await identityFromSeed(seed).catch(() => null))
        if (identityToCheck) {
          const existingIdentities = cachedAccounts.map((entry) => entry.identity)
          if (existingIdentities.includes(identityToCheck)) {
            setStatus(t('onboarding.errors.addressExists'))
            setIsSaving(false)
            setStep(1)
            return
          }
        }
      }
      const entry = await vault.addSeed({ name, seed, overwrite: true })
      await vault.save()
      const existing = getCachedAccounts().filter((item) => item.identity !== entry.identity)
      saveCachedAccounts([...existing, { name: entry.name, identity: entry.identity }])
      if (variant !== 'add-address') {
        setUnlocked()
        setOnboarded(entry.identity, name)
      }
      clearSensitiveState()
      navigate(onCompletePath)
    } catch {
      setStatus(t('onboarding.errors.importFailed'))
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
                ? t('onboarding.importSeed.titleAddAddress')
                : t('onboarding.importSeed.title')
            }
            stepLabel={t('common.step', { current: step, total: TOTAL_STEPS })}
            progressValue={progressValue}
          />
        </div>

        <div className="flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  {t('onboarding.importSeed.pasteSeedTitle')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.importSeed.pasteSeedSubtitle')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seed">{t('common.seedLabel')}</Label>
                <Textarea
                  id="seed"
                  rows={3}
                  value={seed}
                  onChange={(event) => handleSeedChange(event.target.value)}
                  aria-invalid={!isSeedValid}
                />
                <p className={`text-xs ${isSeedValid ? 'text-success' : 'text-muted-foreground'}`}>
                  {seedValidationMessage}
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  {t('onboarding.importSeed.labelSecureTitle')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {variant === 'add-address'
                    ? t('onboarding.importSeed.labelSecureSubtitleAddress')
                    : t('onboarding.importSeed.labelSecureSubtitleWallet')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet-name">
                  {variant === 'add-address' ? t('common.addressLabel') : t('common.accountName')}
                </Label>
                <Input
                  id="wallet-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passphrase">
                  {variant === 'add-address'
                    ? t('common.currentVaultPassphrase')
                    : t('common.vaultPassphrase')}
                </Label>
                <PasswordInput
                  id="passphrase"
                  value={passphrase}
                  onChange={(event) => setPassphrase(event.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{t('onboarding.importSeed.reviewTitle')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.importSeed.reviewSubtitle')}
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
              </div>
              <p className="text-xs text-muted-foreground">
                {t('onboarding.importSeed.seedPrivacyNotice')}
              </p>
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
            <Button
              size="lg"
              onClick={handleNext}
              className="flex-1"
              disabled={step === 1 && !isSeedValid}
            >
              {t('common.continue')}
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" onClick={handleImport} className="flex-1" disabled={isSaving}>
              <KeyRoundIcon className="h-5 w-5" />
              {variant === 'add-address'
                ? isSaving
                  ? t('onboarding.importSeed.importing')
                  : t('onboarding.importSeed.importAddress')
                : isSaving
                  ? t('onboarding.importSeed.importing')
                  : t('onboarding.importSeed.importSeedAction')}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

export default ImportSeed
