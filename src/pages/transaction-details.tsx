import { useLastProcessedTick, useSdk } from '@qubic-labs/react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getPendingTransaction,
  resolvePendingTransactions,
  usePendingTransactionsVersion,
} from '@/lib/pending-transactions'
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'
import TxDetailsHeader from '@/components/pages/transaction-details/tx-details-header'
import TxDetailsRow, { formatValue } from '@/components/pages/transaction-details/tx-details-row'

const formatIntegerLike = (value: unknown): string => {
  if (value === null || value === undefined) return '--'

  if (typeof value === 'bigint') {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '--'
    return Math.trunc(value).toLocaleString()
  }

  if (typeof value === 'string') {
    const normalized = value.trim()
    if (/^-?\d+$/.test(normalized)) {
      const sign = normalized.startsWith('-') ? '-' : ''
      const digits = sign ? normalized.slice(1) : normalized
      return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    }
  }

  return formatValue(value)
}

const TX_DETAILS_SKELETON_IDS = ['a', 'b', 'c', 'd', 'e', 'f'] as const

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

  const txQuery = useQuery({
    queryKey: ['qubic', 'tx-by-hash', hash],
    enabled: Boolean(hash),
    queryFn: () => sdk.rpc.query.getTransactionByHash(hash),
    refetchInterval: isPending ? 5_000 : false,
  })
  useEffect(() => {
    if (!hash) return
    if (txQuery.data) {
      resolvePendingTransactions([{ hash }], archiverProcessedTick)
      return
    }
    resolvePendingTransactions([], archiverProcessedTick)
  }, [hash, archiverProcessedTick, txQuery.data])

  const details = txQuery.data as Record<string, unknown> | undefined

  const formatTimestamp = (ts: unknown): string => {
    if (ts === null || ts === undefined) return '--'
    const num = typeof ts === 'bigint' ? Number(ts) : Number(ts)
    if (!num || Number.isNaN(num)) return '--'
    const ms = num > 1e12 ? num : num * 1000
    return new Date(ms).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const rows: Array<{ key: string; label: string; value: unknown; copyable?: boolean }> = [
    { key: 'hash', label: t('txDetails.hash'), value: hash, copyable: true },
    {
      key: 'amount',
      label: t('txDetails.amount'),
      value: formatIntegerLike(details?.amount),
    },
    {
      key: 'timestamp',
      label: t('txDetails.timestamp'),
      value: formatTimestamp(details?.timestamp),
    },
    {
      key: 'tick',
      label: t('txDetails.tick'),
      value: (() => {
        const tick = details?.tickNumber ?? details?.tick ?? pending?.targetTick
        if (tick === null || tick === undefined) return '--'
        return Number(tick).toLocaleString()
      })(),
    },
    { key: 'inputType', label: t('txDetails.inputType'), value: details?.inputType },
    { key: 'source', label: t('txDetails.source'), value: details?.source, copyable: true },
    {
      key: 'destination',
      label: t('txDetails.destination'),
      value: details?.destination,
      copyable: true,
    },
  ]

  const copyValue = async (key: string, value: unknown) => {
    await copyText(formatValue(value), { key })
  }

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-4 px-4 pb-4">
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          {t('txDetails.back')}
        </button>
        <TxDetailsHeader hash={hash} copiedKey={copiedKey} onCopy={copyValue} />

        {txQuery.isLoading && (
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

        {txQuery.error && !isPending && (
          <div className="text-xs text-destructive">
            {txQuery.error instanceof Error ? txQuery.error.message : t('txDetails.error')}
          </div>
        )}
        {isPending && !details && (
          <div className="animate-pulse text-xs text-amber-700 dark:text-amber-300">
            {t('txDetails.pendingHint')}
          </div>
        )}

        {details && (
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
