import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'

type PassphraseStepProps = {
  variant: 'onboarding' | 'add-address'
  name: string
  passphrase: string
  confirmPassphrase: string
  onNameChange: (value: string) => void
  onPassphraseChange: (value: string) => void
  onConfirmPassphraseChange: (value: string) => void
}

const PassphraseStep = ({
  variant,
  name,
  passphrase,
  confirmPassphrase,
  onNameChange,
  onPassphraseChange,
  onConfirmPassphraseChange,
}: PassphraseStepProps) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{t('onboarding.passphraseStep.title')}</h3>
        <p className="text-xs text-muted-foreground">
          {variant === 'add-address'
            ? t('onboarding.passphraseStep.subtitleAddress')
            : t('onboarding.passphraseStep.subtitleWallet')}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wallet-name">
          {variant === 'add-address' ? t('common.addressLabel') : t('common.accountName')}
        </Label>
        <Input
          id="wallet-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
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
          onChange={(event) => onPassphraseChange(event.target.value)}
        />
        {variant !== 'add-address' && (
          <p className="text-xs text-muted-foreground">{t('onboarding.passphraseStep.minChars')}</p>
        )}
      </div>
      {variant !== 'add-address' && (
        <div className="space-y-2">
          <Label htmlFor="confirm-passphrase">
            {t('onboarding.passphraseStep.reenterPassphrase')}
          </Label>
          <PasswordInput
            id="confirm-passphrase"
            value={confirmPassphrase}
            onChange={(event) => onConfirmPassphraseChange(event.target.value)}
          />
        </div>
      )}
    </div>
  )
}

export default PassphraseStep
