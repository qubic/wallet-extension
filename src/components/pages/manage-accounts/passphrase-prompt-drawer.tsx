import { CheckIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'

type PassphrasePromptDrawerProps = {
  open: boolean
  passphrase: string
  error: string
  onOpenChange: (open: boolean) => void
  onPassphraseChange: (value: string) => void
  onSubmit: () => void
}

const PassphrasePromptDrawer = ({
  open,
  passphrase,
  error,
  onOpenChange,
  onPassphraseChange,
  onSubmit,
}: PassphrasePromptDrawerProps) => {
  const { t } = useTranslation()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('accounts.manage.passphraseTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-2 px-4">
          <Label htmlFor="vault-passphrase">{t('accounts.manage.passphrase')}</Label>
          <PasswordInput
            id="vault-passphrase"
            value={passphrase}
            onChange={(event) => onPassphraseChange(event.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DrawerFooter>
          <Button onClick={onSubmit}>
            <CheckIcon className="h-4 w-4" />
            {t('accounts.manage.confirm')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default PassphrasePromptDrawer
