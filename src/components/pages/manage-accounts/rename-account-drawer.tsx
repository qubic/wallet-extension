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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AccountEntry } from '@/components/pages/manage-accounts/types'

type RenameAccountDrawerProps = {
  open: boolean
  target: AccountEntry | null
  value: string
  error: string
  loading: boolean
  onOpenChange: (open: boolean) => void
  onValueChange: (value: string) => void
  onSubmit: () => void
}

const RenameAccountDrawer = ({
  open,
  value,
  error,
  loading,
  onOpenChange,
  onValueChange,
  onSubmit,
}: RenameAccountDrawerProps) => {
  const { t } = useTranslation()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('accounts.manage.renameTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-2 px-4">
          <Label htmlFor="rename-input">{t('accounts.manage.renameLabel')}</Label>
          <Input
            id="rename-input"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DrawerFooter>
          <Button onClick={onSubmit} disabled={!value.trim() || loading}>
            <CheckIcon className="h-4 w-4" />
            {t('accounts.manage.save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default RenameAccountDrawer
