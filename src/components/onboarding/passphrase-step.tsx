import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

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
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
        <InputGroup>
          <InputGroupInput
            id="passphrase"
            type={showPassphrase ? 'text' : 'password'}
            value={passphrase}
            onChange={(event) => onPassphraseChange(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
              onClick={() => setShowPassphrase((prev) => !prev)}
            >
              {showPassphrase ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {variant !== 'add-address' && (
          <p className="text-xs text-muted-foreground">Minimum 12 characters.</p>
        )}
      </div>
      {variant !== 'add-address' && (
        <div className="space-y-2">
          <Label htmlFor="confirm-passphrase">Re-enter vault passphrase</Label>
          <InputGroup>
            <InputGroupInput
              id="confirm-passphrase"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassphrase}
              onChange={(event) => onConfirmPassphraseChange(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={showConfirm ? 'Hide passphrase' : 'Show passphrase'}
                onClick={() => setShowConfirm((prev) => !prev)}
              >
                {showConfirm ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      )}
    </div>
  )
}

export default PassphraseStep
