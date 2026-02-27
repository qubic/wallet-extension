import { CopyIcon, RefreshCwIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  onConfirmChange: (checked: boolean) => void
}

const SeedSecurityStep = ({
  variant,
  seed,
  identity,
  hasConfirmedSeedBackup,
  onGenerate,
  onConfirmChange,
}: SeedSecurityStepProps) => {
  const { t } = useTranslation()
  const { copyText } = useClipboardCopy()

  const handleCopy = () => {
    copyText(seed, {
      messages: { successTitle: t('onboarding.seedSecurity.seedCopied') },
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{t('onboarding.seedSecurity.title')}</h3>
        <p className="text-xs text-muted-foreground">
          {variant === 'add-address'
            ? t('onboarding.seedSecurity.subtitleAddAddress')
            : t('onboarding.seedSecurity.subtitle')}
        </p>
      </div>
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground dark:text-white">
        {t('onboarding.seedSecurity.warningTitle')}
      </div>
      <div className="space-y-2">
        <Label htmlFor="seed">{t('onboarding.seedSecurity.seedLabel')}</Label>
        <Textarea id="seed" rows={3} value={seed} readOnly className="resize-none" />
      </div>
      <div className="space-y-2">
        <Label>{t('onboarding.seedSecurity.publicIdentityLabel')}</Label>
        <div className="rounded-md border border-border/60 bg-card px-3 py-2 text-sm text-foreground break-all">
          {identity || t('onboarding.seedSecurity.deriving')}
        </div>
      </div>
      <div className="grid gap-3">
        <Button size="lg" variant="secondary" className="w-full" onClick={onGenerate}>
          <RefreshCwIcon className="h-5 w-5" />
          {t('onboarding.seedSecurity.generateNew')}
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={handleCopy}>
          <CopyIcon className="h-5 w-5" />
          {t('onboarding.seedSecurity.copySeed')}
        </Button>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
        <Checkbox
          id="seed-confirmation"
          checked={hasConfirmedSeedBackup}
          onCheckedChange={(checked) => onConfirmChange(checked === true)}
        />
        <Label htmlFor="seed-confirmation" className="text-xs text-muted-foreground">
          {t('onboarding.seedSecurity.confirmationLabel')}
        </Label>
      </div>
    </div>
  )
}

export default SeedSecurityStep
