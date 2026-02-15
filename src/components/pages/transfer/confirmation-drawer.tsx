import { AlertTriangleIcon, SendIcon, XIcon } from 'lucide-react'
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
import { formatBalance, parseAmount } from '@/lib/utils'
import SummaryRow from '@/components/pages/transfer/summary-row'

type ConfirmationDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceIdentity: string
  recipient: string
  amount: string
  tokenName: string
  sending: boolean
  onCancel: () => void
  onConfirm: () => void
}

const ConfirmationDrawer = ({
  open,
  onOpenChange,
  sourceIdentity,
  recipient,
  amount,
  tokenName,
  sending,
  onCancel,
  onConfirm,
}: ConfirmationDrawerProps) => {
  const { t } = useTranslation()
  const parsed = parseAmount(amount) || 0n

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="min-h-[56vh] border-none bg-background">
        <DrawerHeader>
          <DrawerTitle>{t('transfer.confirm.title')}</DrawerTitle>
          <DrawerDescription>{t('transfer.confirm.description')}</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-2">
          <div className="space-y-3">
            <SummaryRow label={t('transfer.form.from')} value={sourceIdentity} mono />
            <SummaryRow label={t('transfer.confirm.to')} value={recipient} mono />
            <SummaryRow
              label={t('transfer.confirm.amount')}
              value={`${formatBalance(parsed)} ${tokenName}`}
              emphasize
            />
            {tokenName !== 'QU' && (
              <SummaryRow label={t('transfer.confirm.feeLabel')} value="100 QU" />
            )}
          </div>

          <div className="flex items-start gap-2 border-t border-border/40 pt-3 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t('transfer.confirm.warning')}</span>
          </div>
        </div>

        <DrawerFooter>
          <div className="flex flex-col gap-2">
            <Button onClick={onConfirm} size="lg" className="w-full gap-2" disabled={sending}>
              <SendIcon className="h-4 w-4" />
              {sending ? t('transfer.actions.sending') : t('transfer.actions.confirm')}
            </Button>
            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="w-full gap-2"
              disabled={sending}
            >
              <XIcon className="h-4 w-4" />
              {t('transfer.actions.cancel')}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default ConfirmationDrawer
