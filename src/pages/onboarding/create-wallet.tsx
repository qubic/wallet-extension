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
  getWatchOnlyAccounts,
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
  const [hasCopiedSeed, setHasCopiedSeed] = useState(false)
  const [hasConfirmedSeedBackup, setHasConfirmedSeedBackup] = useState(false)

  const progressValue = useMemo(() => (step / TOTAL_STEPS) * 100, [step])

  const clearSensitiveState = () => {
    setSeed('')
    setPassphrase('')
    setConfirmPassphrase('')
    setHasCopiedSeed(false)
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
    setHasCopiedSeed(false)
    setHasConfirmedSeedBackup(false)
  }

  const handleCopySeed = async () => {
    try {
      await navigator.clipboard.writeText(seed)
      setHasCopiedSeed(true)
      setStatus(null)
    } catch {
      setStatus('Unable to copy seed. Please copy it manually.')
    }
  }

  const handleNext = async () => {
    setStatus(null)

    if (step === 1 && !isSeedLike(seed)) {
      setStatus('Seed must be 55 lowercase letters.')
      return
    }

    if (step === 1 && !hasConfirmedSeedBackup) {
      setStatus('Please confirm you saved your seed securely.')
      return
    }

    if (step === 1 && variant === 'add-address') {
      const cachedAccounts = getCachedAccounts()
      if (cachedAccounts.some((entry) => entry.identity === identity)) {
        setStatus('This address already exists.')
        return
      }
    }

    if (step === 2 && !passphrase.trim()) {
      setStatus('Passphrase is required.')
      return
    }
    if (step === 2 && variant !== 'add-address') {
      if (!confirmPassphrase.trim()) {
        setStatus('Please re-enter your passphrase.')
        return
      }
      if (passphrase !== confirmPassphrase) {
        setStatus('Passphrases do not match.')
        return
      }
      if (passphrase.length < 12) {
        setStatus('Passphrase must be at least 12 characters.')
        return
      }
    }
    if (step === 2 && variant === 'add-address') {
      const existingNames = [
        ...getCachedAccounts().map((entry) => entry.name.toLowerCase()),
        ...getWatchOnlyAccounts().map((entry) => entry.name.toLowerCase()),
      ]
      if (existingNames.includes(name.trim().toLowerCase())) {
        setStatus('Wallet name already exists.')
        return
      }
      const result = await validateVaultPassphrase(passphrase.trim())
      if (!result.valid) {
        setStatus(
          result.reason === 'invalid'
            ? 'Invalid vault passphrase.'
            : 'Failed to validate vault passphrase.',
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
      setStatus('Seed must be 55 lowercase letters.')
      setStep(1)
      return
    }

    if (!passphrase.trim()) {
      setStatus('Passphrase is required.')
      setStep(2)
      return
    }
    if (variant !== 'add-address') {
      if (!confirmPassphrase.trim()) {
        setStatus('Please re-enter your passphrase.')
        setStep(2)
        return
      }
      if (passphrase !== confirmPassphrase) {
        setStatus('Passphrases do not match.')
        setStep(2)
        return
      }
      if (passphrase.length < 12) {
        setStatus('Passphrase must be at least 12 characters.')
        setStep(2)
        return
      }
    }

    const cachedAccounts = getCachedAccounts()
    const existingNames = [
      ...cachedAccounts.map((entry) => entry.name.toLowerCase()),
      ...getWatchOnlyAccounts().map((entry) => entry.name.toLowerCase()),
    ]
    if (existingNames.includes(name.trim().toLowerCase())) {
      setStatus('Wallet name already exists.')
      setStep(2)
      return
    }
    if (cachedAccounts.some((entry) => entry.identity === identity)) {
      setStatus('This address already exists.')
      setStep(1)
      return
    }

    try {
      setIsSaving(true)
      const vault = await openBrowserVault(passphrase, variant !== 'add-address')
      if (variant === 'add-address') {
        const check = await verifyVaultAccess(vault)
        if (!check.valid) {
          setStatus('Invalid vault passphrase.')
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
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create wallet.')
      setIsSaving(false)
    }
  }

  return (
    <section className="flex h-full w-full justify-center px-6 py-8">
      <div className="flex w-full max-w-sm flex-col justify-between gap-6">
        <div className="space-y-3 text-center">
          <FlowHeader
            title={variant === 'add-address' ? 'Add new address' : 'Create new wallet'}
            stepLabel={`Step ${step} of ${TOTAL_STEPS}`}
            progressValue={progressValue}
          />
        </div>

        <div className="flex-1 space-y-4">
          {step === 1 && (
            <SeedSecurityStep
              variant={variant}
              seed={seed}
              identity={identity}
              hasCopiedSeed={hasCopiedSeed}
              hasConfirmedSeedBackup={hasConfirmedSeedBackup}
              onGenerate={regenerate}
              onCopy={handleCopySeed}
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
                <h3 className="text-sm font-semibold">Ready to create</h3>
                <p className="text-xs text-muted-foreground">
                  Review your details before creating the vault.
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{variant === 'add-address' ? 'Address label' : 'Wallet name'}</span>
                  <span className="text-foreground">{name || 'main'}</span>
                </div>
                <div className="text-xs text-muted-foreground">Seed length: {seed.length}</div>
                <div className="text-xs text-muted-foreground">
                  Identity:
                  <div className="mt-1 break-all text-foreground">{identity || '...'}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure you stored your seed. Anyone with this seed can access your funds.
              </p>
            </div>
          )}

          {status && <p className="text-xs text-destructive">{status}</p>}
        </div>

        <div className="flex w-full gap-3">
          <Button size="lg" variant="ghost" onClick={handleBack} className="flex-1">
            <ArrowLeftIcon className="h-5 w-5" />
            {step === 1 ? 'Back' : 'Previous'}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button size="lg" onClick={handleNext} className="flex-1">
              Continue
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" onClick={handleCreate} className="flex-1" disabled={isSaving}>
              <CheckCircleIcon className="h-5 w-5" />
              {variant === 'add-address'
                ? isSaving
                  ? 'Adding...'
                  : 'Add address'
                : isSaving
                  ? 'Creating...'
                  : 'Create wallet'}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

export default CreateWallet
