import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Name and protect it</h3>
        <p className="text-xs text-muted-foreground">
          {variant === 'add-address'
            ? 'Give this wallet a label and enter the current vault passphrase.'
            : 'Give this wallet a label and set a vault passphrase.'}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wallet-name">
          {variant === 'add-address' ? 'Address label' : 'Wallet name'}
        </Label>
        <Input
          id="wallet-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passphrase">
          {variant === 'add-address' ? 'Current vault passphrase' : 'Vault passphrase'}
        </Label>
        <Input
          id="passphrase"
          type="password"
          value={passphrase}
          onChange={(event) => onPassphraseChange(event.target.value)}
        />
        {variant !== 'add-address' && (
          <p className="text-xs text-muted-foreground">Minimum 12 characters.</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-passphrase">Re-enter vault passphrase</Label>
        <Input
          id="confirm-passphrase"
          type="password"
          value={confirmPassphrase}
          onChange={(event) => onConfirmPassphraseChange(event.target.value)}
        />
      </div>
    </div>
  )
}

export default PassphraseStep
