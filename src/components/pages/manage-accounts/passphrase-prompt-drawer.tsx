import { CheckIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useDrawerAutoFocus } from '@/hooks/use-drawer-auto-focus'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
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
  const { ref: inputRef, onOpenAutoFocus } = useDrawerAutoFocus<HTMLInputElement>()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent onOpenAutoFocus={onOpenAutoFocus}>
        <DrawerHeader>
          <DrawerTitle>{t('accounts.manage.passphraseTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-2 px-4">
          <Label htmlFor="vault-passphrase">{t('accounts.manage.passphrase')}</Label>
          <Input
            ref={inputRef}
            id="vault-passphrase"
            type="password"
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
