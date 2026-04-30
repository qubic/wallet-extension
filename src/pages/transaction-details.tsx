import { useLastProcessedTick, useSdk } from '@qubic-labs/react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, ClockIcon } from 'lucide-react'
import {
  CheckCircleFilledIcon,
  CheckCircleIcon,
  XCircleFilledIcon,
} from '@/components/icons/tx-status-icons'
import { SmartContractIcon } from '@/components/icons/smart-contract-icon'
import type React from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getPendingTransaction,
  resolvePendingTransactions,
  usePendingTransactionsVersion,
} from '@/lib/pending-transactions'
import { computeTransactionStatus, isTransactionFailed } from '@/lib/transaction-status'
import { useAddressName } from '@/hooks/use-address-name'
import { useTxTypeDescription } from '@/hooks/use-tx-type-description'
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'
import { formatAddressLabel, formatIntegerLike, formatNumber, toTimestampMs } from '@/lib/utils'
import { NATIVE_TOKEN_SYMBOL } from '@/lib/config/constants'
import TxDetailsHeader from '@/components/pages/transaction-details/tx-details-header'
import TxDetailsRow, {
  formatValueAsString,
} from '@/components/pages/transaction-details/tx-details-row'

const TX_DETAILS_SKELETON_IDS = ['a', 'b', 'c', 'd', 'e', 'f'] as const

const formatTimestamp = (ts: unknown): string => {
  if (ts === null || ts === undefined) return '--'
  const num = Number(ts)
  if (!num || Number.isNaN(num)) return '--'
  const ms = toTimestampMs(num)
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const TransactionDetails = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hash = '' } = useParams<{ hash: string }>()
  const sdk = useSdk()
  usePendingTransactionsVersion()
  const { copiedKey, copyText } = useClipboardCopy({
    successTitle: t('txDetails.copied'),
    errorTitle: t('txDetails.copyFailed'),
  })
  const lastProcessedTickQuery = useLastProcessedTick({ refetchInterval: 15_000 })
  const archiverProcessedTick = lastProcessedTickQuery.data?.tickNumber
  const pending = getPendingTransaction(hash)
  const isPending = pending?.status === 'pending'
  const isInvalid = pending?.status === 'invalid'

  const txQuery = useQuery({
    queryKey: ['qubic', 'tx-by-hash', hash],
    enabled: Boolean(hash),
    queryFn: () => sdk.rpc.query.getTransactionByHash(hash),
    refetchInterval: isPending ? 5_000 : false,
  })
  useEffect(() => {
    if (!hash) return
    if (txQuery.data) {
      resolvePendingTransactions(
        [
          {
            hash,
            moneyFlew: txQuery.data.moneyFlew,
            inputType: txQuery.data.inputType,
            amount: txQuery.data.amount,
            destination: txQuery.data.destination,
          },
        ],
        archiverProcessedTick,
      )
      return
    }
    resolvePendingTransactions([], archiverProcessedTick)
  }, [hash, archiverProcessedTick, txQuery.data])

  const details = txQuery.data as Record<string, unknown> | undefined
  const isFailed = isTransactionFailed({
    moneyFlew: details?.moneyFlew as boolean | undefined,
    inputType: details?.inputType as number | undefined,
    amount: details?.amount as number | bigint | undefined,
    destination: details?.destination as string | undefined,
  })
  const sourceAddress = (details?.source as string) || pending?.sourceIdentity || ''
  const destAddress = (details?.destination as string) || pending?.destinationIdentity || ''
  const sourceName = useAddressName(sourceAddress)
  const destName = useAddressName(destAddress)
  const txTypeDescription = useTxTypeDescription(
    destAddress,
    Number(details?.inputType ?? pending?.inputType ?? 0),
  )

  const amount = details?.amount ?? pending?.amount
  const tickNumber = details?.tickNumber ?? pending?.targetTick

  const confirmedStatus =
    !isPending && !isInvalid && details
      ? computeTransactionStatus(
          Number(details.inputType ?? 0),
          details.amount as number | bigint,
          details.moneyFlew as boolean,
          details.destination as string | undefined,
        )
      : undefined

  const statusIcon = isPending ? (
    <ClockIcon className="h-3.5 w-3.5 animate-pulse text-amber-700 dark:text-amber-300" />
  ) : isInvalid ? (
    <XCircleFilledIcon className="h-3.5 w-3.5 text-red-700 dark:text-red-300" />
  ) : confirmedStatus === 'failure' ? (
    <XCircleFilledIcon className="h-3.5 w-3.5 text-red-700 dark:text-red-300" />
  ) : confirmedStatus === 'success' ? (
    <CheckCircleFilledIcon className="h-3.5 w-3.5 text-positive" />
  ) : confirmedStatus === 'executed' ? (
    <CheckCircleIcon className="h-3.5 w-3.5 text-positive" />
  ) : undefined

  const rows: Array<{
    key: string
    label: string
    value: unknown
    copyable?: boolean
    copyText?: string
    icon?: React.ReactNode
  }> = [
    { key: 'hash', label: t('txDetails.txId'), value: hash, copyable: true, icon: statusIcon },
    {
      key: 'amount',
      label: t('txDetails.amount'),
      value: amount != null ? `${formatIntegerLike(amount)} ${NATIVE_TOKEN_SYMBOL}` : '--',
    },
    {
      key: 'inputType',
      label: t('txDetails.txType'),
      value: txTypeDescription,
    },
    {
      key: 'source',
      label: t('txDetails.source'),
      value:
        sourceName?.type === 'smartContract' ? (
          <span className="inline-flex items-center gap-1">
            <SmartContractIcon className="h-3.5 w-3.5 shrink-0" />
            {formatAddressLabel(sourceAddress, sourceName.name)}
          </span>
        ) : sourceName ? (
          formatAddressLabel(sourceAddress, sourceName.name)
        ) : (
          sourceAddress || '--'
        ),
      copyable: Boolean(sourceAddress),
      copyText: sourceAddress,
    },
    {
      key: 'destination',
      label: t('txDetails.destination'),
      value:
        destName?.type === 'smartContract' ? (
          <span className="inline-flex items-center gap-1">
            <SmartContractIcon className="h-3.5 w-3.5 shrink-0" />
            {formatAddressLabel(destAddress, destName.name)}
          </span>
        ) : destName ? (
          formatAddressLabel(destAddress, destName.name)
        ) : (
          destAddress || '--'
        ),
      copyable: Boolean(destAddress),
      copyText: destAddress,
    },
    {
      key: 'tick',
      label: t('txDetails.tick'),
      value: tickNumber != null ? formatNumber(Number(tickNumber)) : '--',
    },
    {
      key: 'timestamp',
      label: t('txDetails.timestamp'),
      value: formatTimestamp(details?.timestamp),
    },
  ]

  const copyValue = async (key: string, value: unknown, rawText?: string) => {
    await copyText(rawText ?? formatValueAsString(value), { key })
  }

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-3 px-4 pb-4">
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          {t('common.back')}
        </button>
        <TxDetailsHeader hash={hash} tick={tickNumber != null ? Number(tickNumber) : undefined} />

        {txQuery.isLoading && !pending && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t('txDetails.loading')}</div>
            <div className="divide-y divide-border/40">
              {TX_DETAILS_SKELETON_IDS.map((id) => (
                <div key={`tx-details-skeleton-${id}`} className="space-y-2 py-2">
                  <div className="h-3 w-20 animate-pulse rounded bg-muted/35" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted/25" />
                </div>
              ))}
            </div>
          </div>
        )}

        {txQuery.error && !isPending && !isFailed && !isInvalid && (
          <div className="text-xs text-destructive">
            {txQuery.error instanceof Error ? txQuery.error.message : t('txDetails.error')}
          </div>
        )}
        {isPending && !details && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2.5">
            <span className="text-xs text-amber-700 dark:text-amber-300">
              {t('txDetails.pendingHint')}
            </span>
          </div>
        )}
        {isFailed && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2.5">
            <span className="text-xs text-red-700 dark:text-red-300">
              {t('txDetails.failedHint')}
            </span>
          </div>
        )}
        {isInvalid && !details && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2.5">
            <span className="text-xs text-red-700 dark:text-red-300">
              {t('txDetails.invalidHint')}
            </span>
          </div>
        )}

        {(details || pending) && (
          <div className="divide-y divide-border/40">
            {rows.map((row) => (
              <TxDetailsRow key={row.key} row={row} copiedKey={copiedKey} onCopy={copyValue} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default TransactionDetails
