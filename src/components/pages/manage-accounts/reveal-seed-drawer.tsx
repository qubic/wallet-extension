import { CheckIcon, CopyIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Textarea } from '@/components/ui/textarea'

type RevealSeedDrawerProps = {
  open: boolean
  seed: string
  onOpenChange: (open: boolean) => void
  onCopy: () => Promise<void>
}

const RevealSeedDrawer = ({ open, seed, onOpenChange, onCopy }: RevealSeedDrawerProps) => {
  const { t } = useTranslation()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('accounts.manage.revealTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4">
          <Textarea value={seed} rows={3} readOnly className="resize-none" />
        </div>
        <DrawerFooter>
          <Button variant="outline" onClick={onCopy}>
            <CopyIcon className="h-4 w-4" />
            {t('accounts.manage.copySeed')}
          </Button>
          <DrawerClose asChild>
            <Button>
              <CheckIcon className="h-4 w-4" />
              {t('accounts.manage.done')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default RevealSeedDrawer
