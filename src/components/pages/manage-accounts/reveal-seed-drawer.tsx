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
import { SEED_CLIPBOARD_CLEAR_MS } from '@/lib/clipboard'

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
      clearAfterMs: SEED_CLIPBOARD_CLEAR_MS,
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] border-none bg-background">
        <DrawerHeader>
          <DrawerTitle className="break-words">
            {t('accounts.manage.revealTitle', { name: accountName })}
          </DrawerTitle>
        </DrawerHeader>
        <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-2">
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-1">
                <img src={qrDataUrl} alt={t('accounts.manage.qrAlt')} className="h-48 w-48" />
                <p className="text-muted-foreground text-xs">{t('accounts.manage.qrLabel')}</p>
              </div>
            )}
            <Textarea value={seed} rows={3} readOnly className="resize-none" />
          </div>
        </div>
        <DrawerFooter className="border-t border-border/60 bg-background">
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
