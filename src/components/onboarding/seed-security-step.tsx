import { CopyIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'

type SeedSecurityStepProps = {
  variant: 'onboarding' | 'add-address'
  seed: string
  identity: string
  hasConfirmedSeedBackup: boolean
  onGenerate: () => void
  onCopy: () => void
  onConfirmChange: (checked: boolean) => void
}

const SeedSecurityStep = ({
  variant,
  seed,
  identity,
  hasConfirmedSeedBackup,
  onGenerate,
  onCopy,
  onConfirmChange,
}: SeedSecurityStepProps) => {
  const { copyText } = useClipboardCopy()

  const handleCopy = async () => {
    await copyText(seed, {
      messages: { successTitle: 'Seed copied' },
    })
    onCopy()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Secure your seed</h3>
        <p className="text-xs text-muted-foreground">
          {variant === 'add-address'
            ? 'Save this 55-letter seed in a safe place. You will need it to restore this address.'
            : 'Save this 55-letter seed in a safe place. You will need it to restore your wallet.'}
        </p>
      </div>
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground dark:text-white">
        Save this seed securely.
      </div>
      <div className="space-y-2">
        <Label htmlFor="seed">Seed</Label>
        <Textarea id="seed" rows={3} value={seed} readOnly className="resize-none" />
      </div>
      <div className="space-y-2">
        <Label>Public identity</Label>
        <div className="rounded-md border border-border/60 bg-card px-3 py-2 text-sm text-foreground break-all">
          {identity || 'Deriving...'}
        </div>
      </div>
      <div className="grid gap-3">
        <Button size="lg" variant="secondary" className="w-full" onClick={onGenerate}>
          <RefreshCwIcon className="h-5 w-5" />
          Generate new seed
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={handleCopy}>
          <CopyIcon className="h-5 w-5" />
          Copy seed
        </Button>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
        <Checkbox
          id="seed-confirmation"
          checked={hasConfirmedSeedBackup}
          onCheckedChange={(checked) => onConfirmChange(checked === true)}
        />
        <Label htmlFor="seed-confirmation" className="text-xs text-muted-foreground">
          I saved this seed securely and understand it is required to recover this wallet.
        </Label>
      </div>
    </div>
  )
}

export default SeedSecurityStep
