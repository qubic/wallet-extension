import { useMemo, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, FileJsonIcon, UploadCloudIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { setUnlocked } from '@/lib/lock'
import { openBrowserVault, setOnboarded } from '@/lib/vault'
// @ts-expect-error - No type definitions available for this library
import { QubicVault } from '@qubic-lib/qubic-ts-vault-library/dist/vault.js'
import { getWatchOnlyAccounts, saveWatchOnlyAccounts } from '@/lib/accounts'

const TOTAL_STEPS = 3

const ImportVault = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [sourcePassphrase, setSourcePassphrase] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const progressValue = useMemo(() => (step / TOTAL_STEPS) * 100, [step])

  const handleNext = () => {
    setStatus(null)

    if (step === 1 && !file) {
      setStatus(t('onboarding.importVault.errors.selectFile'))
      return
    }

    if (step === 2 && !passphrase.trim()) {
      setStatus(t('onboarding.importVault.errors.passphraseRequired'))
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
      navigate('/')
      return
    }
    setStep((current) => Math.max(current - 1, 1))
  }

  const handleImport = async () => {
    setStatus(null)

    if (!file) {
      setStatus(t('onboarding.importVault.errors.selectFile'))
      setStep(1)
      return
    }

    if (!passphrase.trim()) {
      setStatus(t('onboarding.importVault.errors.passphraseRequired'))
      setStep(2)
      return
    }

    try {
      setIsSaving(true)

      const fileText = await file.text()
      let isWebWalletVault = false
      try {
        const data = JSON.parse(fileText)
        isWebWalletVault = !!(data.salt && data.iv && data.cipher)
      } catch {
        // Not valid JSON — treat as SDK format
      }

      if (isWebWalletVault) {
        const qubicVault = new QubicVault()
        const importPassphrase = sourcePassphrase.trim() || passphrase.trim()

        const success = await qubicVault.importAndUnlock(true, importPassphrase, null, file, false)
        if (!success) {
          setStatus(t('onboarding.importVault.errors.importFailed'))
          setIsSaving(false)
          return
        }

        type QubicSeed = {
          encryptedSeed: string
          alias: string
          publicId: string
          isOnlyWatch: boolean
        }
        const seeds = qubicVault.getSeeds() as QubicSeed[]
        if (seeds.length === 0) {
          setStatus(t('onboarding.importVault.errors.noEntries'))
          setIsSaving(false)
          return
        }

        const vault = await openBrowserVault(passphrase.trim(), true)
        const watchOnlyAccounts = getWatchOnlyAccounts()

        for (const seed of seeds) {
          if (seed.isOnlyWatch) {
            const existingAccount = watchOnlyAccounts.find((acc) => acc.identity === seed.publicId)
            if (!existingAccount) {
              watchOnlyAccounts.push({ identity: seed.publicId, name: seed.alias, watchOnly: true })
            }
          } else {
            const decryptedSeed = await qubicVault.revealSeed(seed.publicId)
            await vault.addSeed({ name: seed.alias, seed: decryptedSeed, overwrite: true })
          }
        }

        saveWatchOnlyAccounts(watchOnlyAccounts)
        await vault.save()

        const firstEntry = vault.list()[0]
        const firstWatchOnly = seeds.find((s) => s.isOnlyWatch)
        setOnboarded(
          firstEntry?.identity ?? firstWatchOnly?.publicId,
          firstEntry?.name ?? firstWatchOnly?.alias,
        )
        setUnlocked()
        navigate('/home')
      } else {
        const vault = await openBrowserVault(passphrase.trim(), true)
        await vault.importEncrypted(fileText, {
          mode: 'merge',
          sourcePassphrase: sourcePassphrase.trim() || passphrase.trim(),
        })
        await vault.save()

        const entries = vault.list()
        if (entries.length === 0) {
          setStatus(t('onboarding.importVault.errors.noEntries'))
          setIsSaving(false)
          return
        }

        setOnboarded(entries[0].identity, entries[0].name)
        setUnlocked()
        navigate('/home')
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('onboarding.importVault.errors.generic'))
      setIsSaving(false)
    }
  }

  return (
    <section className="flex h-full w-full justify-center px-6 py-8">
      <div className="flex w-full max-w-sm flex-col justify-between gap-6">
        <div className="space-y-3 text-center">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{t('onboarding.importVault.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('onboarding.importVault.step', { current: step, total: TOTAL_STEPS })}
            </p>
          </div>
          <Progress value={progressValue} />
        </div>

        <div className="flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  {t('onboarding.importVault.selectVault.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.importVault.selectVault.subtitle')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vault-file">{t('onboarding.importVault.selectVault.label')}</Label>
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
                    {t('onboarding.importVault.selectVault.dropText')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('onboarding.importVault.selectVault.browseText')}
                  </div>
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
                  accept="*/*,.json,.qubic-vault"
                  onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  {t('onboarding.importVault.unlockSecure.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.importVault.unlockSecure.subtitle')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passphrase">
                  {t('onboarding.importVault.unlockSecure.newPassphrase')}
                </Label>
                <Input
                  id="passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(event) => setPassphrase(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source-passphrase">
                  {t('onboarding.importVault.unlockSecure.sourcePassphrase')}
                </Label>
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
                <h3 className="text-sm font-semibold">
                  {t('onboarding.importVault.review.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.importVault.review.subtitle')}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('onboarding.importVault.review.vaultFile')}</span>
                  <span className="text-foreground">
                    {file?.name ?? t('onboarding.importVault.review.notSelected')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('onboarding.importVault.review.sourcePassphraseLabel')}:{' '}
                  {sourcePassphrase.trim()
                    ? t('onboarding.importVault.review.sourcePassphraseProvided')
                    : t('onboarding.importVault.review.sourcePassphraseSame')}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('onboarding.importVault.review.addMoreLater')}
              </p>
            </div>
          )}

          {status && <p className="text-xs text-destructive">{status}</p>}
        </div>

        <div className="flex w-full gap-3">
          <Button size="lg" variant="ghost" onClick={handleBack} className="flex-1">
            <ArrowLeftIcon className="h-5 w-5" />
            {step === 1
              ? t('onboarding.importVault.actions.back')
              : t('onboarding.importVault.actions.previous')}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button size="lg" onClick={handleNext} className="flex-1">
              {t('onboarding.importVault.actions.continue')}
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" onClick={handleImport} className="flex-1" disabled={isSaving}>
              <UploadCloudIcon className="h-5 w-5" />
              {isSaving
                ? t('onboarding.importVault.actions.importing')
                : t('onboarding.importVault.actions.import')}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

export default ImportVault
