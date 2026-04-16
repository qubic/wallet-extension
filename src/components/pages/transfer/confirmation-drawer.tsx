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
import { formatAddressLabel, formatBalance, parseAmount, truncateAccountName } from '@/lib/utils'
import { useAddressName } from '@/hooks/use-address-name'
import { NATIVE_TOKEN_SYMBOL } from '@/lib/config/constants'
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
  const sourceName = useAddressName(sourceIdentity)
  const recipientName = useAddressName(recipient)
  const truncatedSourceAccountName =
    sourceName?.type === 'account' ? truncateAccountName(sourceName.name) : null
  const sourceLabel = formatAddressLabel(
    sourceIdentity,
    truncatedSourceAccountName?.text ?? sourceName?.name,
  )
  const sourceLabelTitle = truncatedSourceAccountName?.isTruncated
    ? formatAddressLabel(sourceIdentity, sourceName?.name)
    : undefined
  const truncatedRecipientAccountName =
    recipientName?.type === 'account' ? truncateAccountName(recipientName.name) : null
  const recipientLabel = formatAddressLabel(
    recipient,
    truncatedRecipientAccountName?.text ?? recipientName?.name,
  )
  const recipientLabelTitle = truncatedRecipientAccountName?.isTruncated
    ? formatAddressLabel(recipient, recipientName?.name)
    : undefined

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="min-h-[56vh] border-none bg-background">
        <DrawerHeader>
          <DrawerTitle>{t('transfer.confirm.title')}</DrawerTitle>
          <DrawerDescription>{t('transfer.confirm.description')}</DrawerDescription>
          <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t('transfer.confirm.warning')}</span>
          </div>
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-2">
          <div className="space-y-3">
            <SummaryRow
              label={t('transfer.confirm.from')}
              value={sourceLabel}
              valueTitle={sourceLabelTitle}
              mono
            />
            <SummaryRow
              label={t('transfer.confirm.to')}
              value={recipientLabel}
              valueTitle={recipientLabelTitle}
              mono
            />
            <SummaryRow
              label={t('transfer.confirm.amount')}
              value={`${formatBalance(parsed)} ${tokenName}`}
              emphasize
            />
            {tokenName !== NATIVE_TOKEN_SYMBOL && (
              <SummaryRow
                label={t('transfer.confirm.feeLabel')}
                value={`100 ${NATIVE_TOKEN_SYMBOL}`}
              />
            )}
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
