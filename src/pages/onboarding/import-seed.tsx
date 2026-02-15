import { useMemo, useState } from 'react'
import { identityFromSeed } from '@qubic-labs/core'
import { ArrowLeftIcon, ArrowRightIcon, KeyRoundIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PasswordInput } from '@/components/ui/password-input'
import { isSeedLike } from '@/lib/seed'
import { getCachedAccounts, getWatchOnlyAccounts, saveCachedAccounts } from '@/lib/accounts'
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
  const [step, setStep] = useState(1)
  const [seed, setSeed] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [name, setName] = useState('main')
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [derivedIdentity, setDerivedIdentity] = useState<string | null>(null)
  const progressValue = useMemo(() => (step / TOTAL_STEPS) * 100, [step])
  const seedLength = seed.length
  const isSeedValid = isSeedLike(seed)
  const seedValidationMessage = isSeedValid
    ? 'Valid seed format.'
    : `Seed must be 55 lowercase letters (${seedLength}/${SEED_LENGTH}).`

  const clearSensitiveState = () => {
    setSeed('')
    setPassphrase('')
    setDerivedIdentity(null)
  }

  const handleSeedChange = (value: string) => {
    setSeed(normalizeSeedInput(value))
    if (status === 'Seed must be 55 lowercase letters.') {
      setStatus(null)
    }
  }

  const handleNext = async () => {
    setStatus(null)

    if (step === 1 && !isSeedLike(seed)) {
      setStatus('Seed must be 55 lowercase letters.')
      return
    }

    if (step === 1 && variant === 'add-address') {
      try {
        const identity = await identityFromSeed(seed)
        setDerivedIdentity(identity)
        const cachedAccounts = getCachedAccounts()
        if (cachedAccounts.some((entry) => entry.identity === identity)) {
          setStatus('This address already exists.')
          return
        }
      } catch {
        setStatus('Seed must be 55 lowercase letters.')
        return
      }
    }

    if (step === 2 && !passphrase.trim()) {
      setStatus('Passphrase is required.')
      return
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

  const handleImport = async () => {
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
      if (variant === 'add-address') {
        const identityToCheck = derivedIdentity ?? (await identityFromSeed(seed).catch(() => null))
        if (identityToCheck) {
          const existingIdentities = cachedAccounts.map((entry) => entry.identity)
          if (existingIdentities.includes(identityToCheck)) {
            setStatus('This address already exists.')
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
        setOnboarded(entry.identity, name)
        setUnlocked()
      }
      clearSensitiveState()
      navigate(onCompletePath)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to import seed.')
      setIsSaving(false)
    }
  }

  return (
    <section className="flex h-full w-full justify-center px-6 py-8">
      <div className="flex w-full max-w-sm flex-col justify-between gap-6">
        <div className="space-y-3 text-center">
          <FlowHeader
            title={variant === 'add-address' ? 'Import address seed' : 'Import private seed'}
            stepLabel={`Step ${step} of ${TOTAL_STEPS}`}
            progressValue={progressValue}
          />
        </div>

        <div className="flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Paste your seed</h3>
                <p className="text-xs text-muted-foreground">
                  Enter the 55-letter seed you want to import.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seed">Seed</Label>
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
                <h3 className="text-sm font-semibold">Label and secure</h3>
                <p className="text-xs text-muted-foreground">
                  {variant === 'add-address'
                    ? 'Give this address a label and set a vault passphrase.'
                    : 'Give this wallet a name and set a vault passphrase.'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet-name">
                  {variant === 'add-address' ? 'Address label' : 'Wallet name'}
                </Label>
                <Input
                  id="wallet-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passphrase">
                  {variant === 'add-address' ? 'Current vault passphrase' : 'Vault passphrase'}
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
                <h3 className="text-sm font-semibold">Review import</h3>
                <p className="text-xs text-muted-foreground">
                  Confirm the details before importing.
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{variant === 'add-address' ? 'Address label' : 'Wallet name'}</span>
                  <span className="text-foreground">{name || 'main'}</span>
                </div>
                <div className="text-xs text-muted-foreground">Seed length: {seed.length}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your seed never leaves this device. Keep it private at all times.
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
            <Button
              size="lg"
              onClick={handleNext}
              className="flex-1"
              disabled={step === 1 && !isSeedValid}
            >
              Continue
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" onClick={handleImport} className="flex-1" disabled={isSaving}>
              <KeyRoundIcon className="h-5 w-5" />
              {variant === 'add-address'
                ? isSaving
                  ? 'Importing...'
                  : 'Import address'
                : isSaving
                  ? 'Importing...'
                  : 'Import seed'}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

export default ImportSeed
