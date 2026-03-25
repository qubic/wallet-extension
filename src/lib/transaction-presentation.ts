import type { TFunction } from 'i18next'
import { ReceiveIcon } from '@/components/icons/receive-icon'
import { SendIcon } from '@/components/icons/send-icon'

type Transaction = {
  source: string
  destination: string
  amount: bigint | number
  inputType: number | bigint
}

export const getTransactionPresentation = (tx: Transaction, identity: string, t: TFunction) => {
  const isIncoming = tx.destination === identity
  const isSimpleTransfer = Number(tx.inputType) === 0
  const label = isSimpleTransfer
    ? isIncoming
      ? t('history.received')
      : t('history.sent')
    : isIncoming
      ? t('history.incoming')
      : t('history.outgoing')
  const counterparty = isIncoming ? tx.source : tx.destination
  const Icon = isIncoming ? ReceiveIcon : SendIcon
  let addressPrefix: string | undefined
  if (!isIncoming) {
    addressPrefix = t('history.to')
  } else if (isSimpleTransfer) {
    addressPrefix = t('history.from')
  }

  const amountSign = tx.amount ? (isIncoming ? '+' : '-') : ''
  const amountColorClass = !tx.amount
    ? 'text-muted-foreground'
    : isIncoming
      ? 'text-positive'
      : 'text-[var(--destructive)]'

  return {
    isIncoming,
    isSimpleTransfer,
    label,
    counterparty,
    Icon,
    addressPrefix,
    amountSign,
    amountColorClass,
  }
}
