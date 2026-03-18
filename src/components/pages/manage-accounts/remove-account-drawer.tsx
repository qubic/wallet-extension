import { TrashIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type RemoveAccountDrawerProps = {
  open: boolean
  canRemoveAnyAccount: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

const RemoveAccountDrawer = ({
  open,
  canRemoveAnyAccount,
  onOpenChange,
  onConfirm,
}: RemoveAccountDrawerProps) => {
  const { t } = useTranslation()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('accounts.manage.removeTitle')}</DrawerTitle>
          <DrawerDescription>{t('accounts.manage.removeDesc')}</DrawerDescription>
        </DrawerHeader>
        {!canRemoveAnyAccount && (
          <p className="px-4 text-xs text-destructive">{t('accounts.manage.errors.lastAccount')}</p>
        )}
        <DrawerFooter>
          <Button
            variant="destructive-outline"
            className="w-full"
            disabled={!canRemoveAnyAccount}
            onClick={onConfirm}
          >
            <TrashIcon className="h-4 w-4" />
            {t('accounts.manage.remove')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default RemoveAccountDrawer
