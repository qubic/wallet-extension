import { KeyRoundIcon, PlusCircleIcon, UploadIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type AddAccountDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: () => void
  onImportSeed: () => void
  onWatchOnly: () => void
}

const AddAccountDrawer = ({
  open,
  onOpenChange,
  onCreate,
  onImportSeed,
  onWatchOnly,
}: AddAccountDrawerProps) => {
  const { t } = useTranslation()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('accounts.manage.addTitle')}</DrawerTitle>
          <DrawerDescription>{t('accounts.manage.addNewDesc')}</DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-3 px-4 pb-2">
          <Button size="lg" className="w-full" onClick={onCreate}>
            <PlusCircleIcon className="h-5 w-5" />
            {t('accounts.manage.addCreate')}
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={onImportSeed}>
            <KeyRoundIcon className="h-5 w-5" />
            {t('accounts.manage.addImport')}
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={onWatchOnly}>
            <UploadIcon className="h-5 w-5" />
            {t('accounts.manage.watchOnlyAdd')}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default AddAccountDrawer
