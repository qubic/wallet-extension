import { ArrowLeftIcon, CheckCircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { formatBalance } from '@/lib/utils'
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'
import SummaryRow from '@/components/pages/transfer/summary-row'
import type { TxResult } from '@/components/pages/transfer/types'

type TransferSuccessProps = {
  txResult: TxResult
  onSendAnother: () => void
  onViewHistory: () => void
  onViewDetails: () => void
}

const TransferSuccess = ({
  txResult,
  onSendAnother,
  onViewHistory,
  onViewDetails,
}: TransferSuccessProps) => {
  const { t } = useTranslation()
  const { copyText } = useClipboardCopy()

  const handleCopyTxId = async () => {
    await copyText(txResult.txId, {
      messages: {
        successTitle: t('home.toast.copySuccess'),
        successDescription: t('home.toast.copySuccessDesc'),
        errorTitle: t('home.toast.copyFail'),
        errorDescription: t('home.toast.copyFailDesc'),
      },
    })
  }

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-4">
        <button
          type="button"
          onClick={onSendAnother}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('transfer.actions.back')}
        </button>

        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircleIcon className="h-8 w-8 text-success" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{t('transfer.success.title')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('transfer.success.description', { targetTick: txResult.targetTick })}
            </p>
          </div>

          <div className="w-full space-y-3 text-left">
            <SummaryRow label={t('transfer.form.from')} value={txResult.sourceIdentity} mono />
            <SummaryRow label={t('transfer.confirm.to')} value={txResult.recipient} mono />
            <SummaryRow
              label={t('transfer.success.amount')}
              value={`${formatBalance(txResult.amount)} ${txResult.tokenName}`}
              emphasize
            />
            <SummaryRow label={t('transfer.success.targetTick')} value={txResult.targetTick} mono />
            {txResult.fee > 0n && (
              <SummaryRow
                label={t('transfer.confirm.fee', { fee: '100' })}
                value={`${formatBalance(txResult.fee)} QU`}
              />
            )}
            <SummaryRow
              label={t('transfer.success.txId')}
              value={txResult.txId}
              mono
              copyLabel={t('home.receive.copy')}
              onCopy={handleCopyTxId}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onViewDetails} variant="secondary" size="lg" className="w-full">
            {t('history.details.title')}
          </Button>
          <Button onClick={onViewHistory} variant="outline" size="lg" className="w-full">
            {t('transfer.success.viewHistory')}
          </Button>
          <Button onClick={onSendAnother} size="lg" className="w-full">
            {t('transfer.success.sendAnother')}
          </Button>
        </div>
      </div>
    </section>
  )
}

export default TransferSuccess
