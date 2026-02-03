import { useEffect, useMemo, useState } from 'react'
import { identityFromSeed } from '@qubic-labs/core'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CopyIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { generateSeed, isSeedLike } from '@/lib/seed'
import { openBrowserVault, setOnboarded } from '@/lib/vault'

const TOTAL_STEPS = 3

const CreateWallet = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [seed, setSeed] = useState(() => generateSeed())
  const [passphrase, setPassphrase] = useState('')
  const [name, setName] = useState('main')
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [identity, setIdentity] = useState<string>('')
  const [hasCopiedSeed, setHasCopiedSeed] = useState(false)

  const progressValue = useMemo(() => (step / TOTAL_STEPS) * 100, [step])

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

  const handleNext = () => {
    setStatus(null)

    if (step === 1 && !isSeedLike(seed)) {
      setStatus('Seed must be 55 lowercase letters.')
      return
    }

    if (step === 1 && !hasCopiedSeed) {
      setStatus('Copy your seed before continuing.')
      return
    }

    if (step === 2 && !passphrase.trim()) {
      setStatus('Passphrase is required.')
      return
    }

    setStep((current) => Math.min(current + 1, TOTAL_STEPS))
  }

  const handleBack = () => {
    setStatus(null)
    if (step === 1) {
      navigate('/')
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

    try {
      setIsSaving(true)
      const vault = await openBrowserVault(passphrase, true)
      const entry = await vault.addSeed({ name, seed, overwrite: true })
      await vault.save()
      setOnboarded(entry.identity, name)
      navigate('/home')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create wallet.')
      setIsSaving(false)
    }
  }

  return (
    <section className="flex h-full w-full justify-center px-6 py-8">
      <div className="flex w-full max-w-sm flex-col justify-between gap-6">
        <div className="space-y-3 text-center">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Create new wallet</h2>
            <p className="text-sm text-muted-foreground">Step {step} of {TOTAL_STEPS}</p>
          </div>
          <Progress value={progressValue} />
        </div>

        <div className="flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Secure your seed</h3>
                <p className="text-xs text-muted-foreground">
                  Save this 55-letter seed in a safe place. You will need it to restore
                  your wallet.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seed">Seed</Label>
                <Textarea id="seed" rows={3} value={seed} readOnly className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label>Public identity</Label>
                <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm text-foreground break-all">
                  {identity || 'Deriving...'}
                </div>
              </div>
              <div className="grid gap-3">
                <Button size="lg" variant="secondary" className="w-full" onClick={regenerate}>
                  <RefreshCwIcon className="h-5 w-5" />
                  Generate new seed
                </Button>
                <Button size="lg" variant="outline" className="w-full" onClick={handleCopySeed}>
                  <CopyIcon className="h-5 w-5" />
                  {hasCopiedSeed ? 'Seed copied' : 'Copy seed'}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Name and protect it</h3>
                <p className="text-xs text-muted-foreground">
                  Give this wallet a label and set a vault passphrase.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet-name">Wallet name</Label>
                <Input
                  id="wallet-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passphrase">Vault passphrase</Label>
                <Input
                  id="passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(event) => setPassphrase(event.target.value)}
                />
              </div>
            </div>
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
                  <span>Wallet name</span>
                  <span className="text-foreground">{name || 'main'}</span>
                </div>
                <div className="text-xs text-muted-foreground">Seed length: {seed.length}</div>
                <div className="text-xs text-muted-foreground">
                  Identity:
                  <div className="mt-1 break-all text-foreground">{identity || '...'}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure you stored your seed. Anyone with this seed can access your
                funds.
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
              {isSaving ? 'Creating...' : 'Create wallet'}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

export default CreateWallet
