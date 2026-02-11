import { useMemo, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, FileJsonIcon, UploadCloudIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { setUnlocked } from '@/lib/lock'
import { openBrowserVault, setOnboarded } from '@/lib/vault'

const TOTAL_STEPS = 3

const ImportVault = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [sourcePassphrase, setSourcePassphrase] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const progressValue = useMemo(() => (step / TOTAL_STEPS) * 100, [step])

  const clearSensitiveState = () => {
    setPassphrase('')
    setSourcePassphrase('')
    setFile(null)
  }

  const handleNext = () => {
    setStatus(null)

    if (step === 1 && !file) {
      setStatus('Select a vault file.')
      return
    }

    if (step === 2 && !passphrase.trim()) {
      setStatus('Passphrase is required.')
      return
    }

    setStep((current) => Math.min(current + 1, TOTAL_STEPS))
  }

  const handleFileSelect = (selected: File | null) => {
    setFile(selected)
    setStatus(null)
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const droppedFile = event.dataTransfer.files?.[0] ?? null
    handleFileSelect(droppedFile)
  }

  const handleBack = () => {
    setStatus(null)
    if (step === 1) {
      clearSensitiveState()
      navigate('/')
      return
    }
    setStep((current) => Math.max(current - 1, 1))
  }

  const handleImport = async () => {
    setStatus(null)

    if (!file) {
      setStatus('Select a vault file.')
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
      const fileContents = await file.text()
      await vault.importEncrypted(fileContents, {
        mode: 'merge',
        sourcePassphrase: sourcePassphrase.trim() ? sourcePassphrase : passphrase,
      })
      await vault.save()

      const entries = vault.list()
      if (entries.length === 0) {
        setStatus('Vault imported but no entries were found.')
        setIsSaving(false)
        return
      }

      setOnboarded(entries[0].identity, entries[0].name)
      setUnlocked()
      clearSensitiveState()
      navigate('/home')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to import vault.')
      setIsSaving(false)
    }
  }

  return (
    <section className="flex h-full w-full justify-center px-6 py-8">
      <div className="flex w-full max-w-sm flex-col justify-between gap-6">
        <div className="space-y-3 text-center">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Import vault file</h2>
            <p className="text-sm text-muted-foreground">
              Step {step} of {TOTAL_STEPS}
            </p>
          </div>
          <Progress value={progressValue} />
        </div>

        <div className="flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Select your vault</h3>
                <p className="text-xs text-muted-foreground">
                  Upload the JSON vault file you exported previously.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vault-file">Vault file</Label>
                <label
                  htmlFor="vault-file"
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                    isDragging
                      ? 'border-primary/70 bg-primary/10'
                      : 'border-border/70 bg-muted/10 hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <UploadCloudIcon className="h-5 w-5" />
                    Drop your vault file
                  </div>
                  <div className="text-xs text-muted-foreground">or click to browse (.json)</div>
                  {file && (
                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs text-foreground">
                      <FileJsonIcon className="h-4 w-4 text-primary" />
                      <span className="max-w-[180px] truncate">{file.name}</span>
                    </div>
                  )}
                </label>
                <Input
                  id="vault-file"
                  type="file"
                  accept="application/json"
                  onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Unlock and secure</h3>
                <p className="text-xs text-muted-foreground">
                  Provide a new passphrase for this device and, if needed, the source passphrase.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passphrase">New vault passphrase</Label>
                <Input
                  id="passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(event) => setPassphrase(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source-passphrase">Source vault passphrase</Label>
                <Input
                  id="source-passphrase"
                  type="password"
                  value={sourcePassphrase}
                  onChange={(event) => setSourcePassphrase(event.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Review import</h3>
                <p className="text-xs text-muted-foreground">
                  Confirm the file and passphrase details before importing.
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vault file</span>
                  <span className="text-foreground">{file?.name ?? 'Not selected'}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Source passphrase: {sourcePassphrase.trim() ? 'Provided' : 'Same as new'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                You can add more accounts later in Manage Accounts.
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
              <UploadCloudIcon className="h-5 w-5" />
              {isSaving ? 'Importing...' : 'Import vault'}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

export default ImportVault
