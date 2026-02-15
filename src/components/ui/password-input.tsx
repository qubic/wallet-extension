import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

function PasswordInput({
  groupClassName,
  ...inputProps
}: Omit<React.ComponentProps<'input'>, 'type'> & { groupClassName?: string }) {
  const [visible, setVisible] = useState(false)

  return (
    <InputGroup className={groupClassName}>
      <InputGroupInput {...inputProps} type={visible ? 'text' : 'password'} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

export { PasswordInput }
