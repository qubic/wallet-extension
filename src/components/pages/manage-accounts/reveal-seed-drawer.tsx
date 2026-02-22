import { CheckIcon, CopyIcon } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
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
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'

type RevealSeedDrawerProps = {
  open: boolean
  seed: string
  onOpenChange: (open: boolean) => void
}

const RevealSeedDrawer = ({ open, seed, onOpenChange }: RevealSeedDrawerProps) => {
  const { t } = useTranslation()
  const { copyText } = useClipboardCopy()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (open && seed) {
      QRCode.toDataURL(seed, { width: 200, margin: 2 }).then(setQrDataUrl)
    } else {
      setQrDataUrl(null)
    }
  }, [open, seed])

  const handleCopy = () => {
    copyText(seed, {
      messages: { successTitle: t('accounts.manage.seedCopied') },
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('accounts.manage.revealTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col items-center gap-4 px-4">
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-1">
              <img src={qrDataUrl} alt={t('accounts.manage.qrAlt')} className='h-48 w-48' />
              <p className="text-muted-foreground text-xs">{t('accounts.manage.qrLabel')}</p>
            </div>
          )}
          <Textarea value={seed} rows={3} readOnly className="resize-none" />
        </div>
        <DrawerFooter>
          <Button variant="outline" onClick={handleCopy}>
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
