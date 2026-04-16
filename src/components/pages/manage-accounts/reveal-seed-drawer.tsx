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
import { truncateAccountName } from '@/lib/utils'

type RevealSeedDrawerProps = {
  open: boolean
  seed: string
  accountName: string
  onOpenChange: (open: boolean) => void
}

const RevealSeedDrawer = ({ open, seed, accountName, onOpenChange }: RevealSeedDrawerProps) => {
  const { t } = useTranslation()
  const { copyText } = useClipboardCopy()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const truncatedAccountName = truncateAccountName(accountName)

  useEffect(() => {
    let cancelled = false
    if (open && seed) {
      QRCode.toDataURL(seed, { width: 200, margin: 2 })
        .then((url) => {
          if (!cancelled) setQrDataUrl(url)
        })
        .catch(() => {
          if (!cancelled) setQrDataUrl(null)
        })
    } else {
      setQrDataUrl(null)
    }
    return () => {
      cancelled = true
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
          <DrawerTitle
            title={
              truncatedAccountName.isTruncated
                ? t('accounts.manage.revealTitle', { name: accountName })
                : undefined
            }
          >
            {t('accounts.manage.revealTitle', { name: truncatedAccountName.text })}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col items-center gap-4 px-4">
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-1">
              <img src={qrDataUrl} alt={t('accounts.manage.qrAlt')} className="h-48 w-48" />
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
