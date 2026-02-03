import { useMemo, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, KeyRoundIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { isSeedLike } from '@/lib/seed'
import { openBrowserVault, setOnboarded } from '@/lib/vault'

const TOTAL_STEPS = 3

const ImportSeed = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [seed, setSeed] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [name, setName] = useState('main')
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const progressValue = useMemo(() => (step / TOTAL_STEPS) * 100, [step])

  const handleNext = () => {
    setStatus(null)

    if (step === 1 && !isSeedLike(seed)) {
      setStatus('Seed must be 55 lowercase letters.')
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

    try {
      setIsSaving(true)
      const vault = await openBrowserVault(passphrase, true)
      const entry = await vault.addSeed({ name, seed, overwrite: true })
      await vault.save()
      setOnboarded(entry.identity, name)
      navigate('/home')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to import seed.')
      setIsSaving(false)
    }
  }

  return (
    <section className="flex h-full w-full justify-center px-6 py-8">
      <div className="flex w-full max-w-sm flex-col justify-between gap-6">
        <div className="space-y-3 text-center">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Import private seed</h2>
            <p className="text-sm text-muted-foreground">Step {step} of {TOTAL_STEPS}</p>
          </div>
          <Progress value={progressValue} />
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
                  onChange={(event) => setSeed(event.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Label and secure</h3>
                <p className="text-xs text-muted-foreground">
                  Give this wallet a name and set a vault passphrase.
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
                <h3 className="text-sm font-semibold">Review import</h3>
                <p className="text-xs text-muted-foreground">
                  Confirm the details before importing.
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Wallet name</span>
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
            <Button size="lg" onClick={handleNext} className="flex-1">
              Continue
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" onClick={handleImport} className="flex-1" disabled={isSaving}>
              <KeyRoundIcon className="h-5 w-5" />
              {isSaving ? 'Importing...' : 'Import seed'}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

export default ImportSeed
