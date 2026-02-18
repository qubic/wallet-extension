import { useSdk } from '@qubic-labs/react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, CheckIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { buildExplorerObjectUrl, formatAddressLabel, truncateString } from '@/lib/utils'
import {
  getPendingTransaction,
  resolvePendingTransactions,
  usePendingTransactionsVersion,
} from '@/lib/pending-transactions'
import { useAddressName } from '@/hooks/use-address-name'
import { useProcedureName } from '@/hooks/use-procedure-name'

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '--'
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

const TX_DETAILS_SKELETON_IDS = ['a', 'b', 'c', 'd', 'e', 'f'] as const

type LatestStatsResponse = {
  data?: {
    currentTick?: number
  }
}

const fetchLatestStats = async (): Promise<LatestStatsResponse> => {
  const response = await fetch('https://rpc.qubic.org/v1/latest-stats')
  if (!response.ok) {
    throw new Error('Failed to load network stats.')
  }
  return response.json() as Promise<LatestStatsResponse>
}

const TransactionDetails = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hash = '' } = useParams<{ hash: string }>()
  const sdk = useSdk()
  usePendingTransactionsVersion()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const latestStats = useQuery({
    queryKey: ['qubic', 'latest-stats', 'tx-details'],
    queryFn: fetchLatestStats,
    refetchInterval: 15_000,
    staleTime: 3_000,
    gcTime: 120_000,
  })
  const currentTick = latestStats.data?.data?.currentTick
  const pending = getPendingTransaction(hash, currentTick)
  const isPending = Boolean(pending)

  const txQuery = useQuery({
    queryKey: ['qubic', 'tx-by-hash', hash],
    enabled: Boolean(hash),
    queryFn: () => sdk.rpc.query.getTransactionByHash(hash),
    refetchInterval: isPending ? 5_000 : false,
  })
  useEffect(() => {
    if (!hash) return
    resolvePendingTransactions([{ hash }], currentTick)
  }, [hash, currentTick])

  const details = txQuery.data as Record<string, unknown> | undefined
  const sourceAddress = (details?.source as string) ?? ''
  const destAddress = (details?.destination as string) ?? ''
  const sourceName = useAddressName(sourceAddress)
  const destName = useAddressName(destAddress)
  const procedureName = useProcedureName(destAddress, Number(details?.inputType ?? 0))

  const rows: Array<{
    key: string
    label: string
    value: unknown
    copyable?: boolean
    copyText?: string
  }> = [
    { key: 'hash', label: t('txDetails.hash'), value: hash, copyable: true },
    { key: 'amount', label: t('txDetails.amount'), value: details?.amount },
    {
      key: 'tick',
      label: t('txDetails.tick'),
      value: details?.tickNumber ?? details?.tick ?? pending?.targetTick ?? '--',
    },
    {
      key: 'inputType',
      label: t('txDetails.inputType'),
      value: procedureName
        ? `${details?.inputType} (${procedureName})`
        : details?.inputType,
    },
    {
      key: 'source',
      label: t('txDetails.source'),
      value: sourceName
        ? formatAddressLabel(sourceAddress, sourceName.name)
        : details?.source,
      copyable: true,
      copyText: sourceAddress,
    },
    {
      key: 'destination',
      label: t('txDetails.destination'),
      value: destName
        ? formatAddressLabel(destAddress, destName.name)
        : details?.destination,
      copyable: true,
      copyText: destAddress,
    },
  ]

  const copyValue = async (key: string, value: unknown, copyText?: string) => {
    try {
      await navigator.clipboard.writeText(copyText ?? formatValue(value))
      setCopiedKey(key)
      toast.success(t('txDetails.copied'))
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current))
      }, 1200)
    } catch {
      toast.error(t('txDetails.copyFailed'))
    }
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
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            {t('txDetails.title')}
          </div>
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs text-foreground">
              {truncateString(hash, { emptyLabel: '--' })}
            </div>
            <button
              type="button"
              className="h-4 w-4 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => copyValue('hash', hash)}
              aria-label={t('txDetails.copyTxId')}
            >
              {copiedKey === 'hash' ? (
                <CheckIcon className="h-3 w-3" />
              ) : (
                <CopyIcon className="h-3 w-3" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={buildExplorerObjectUrl('tx', hash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border/50 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              {t('txDetails.openExplorer')}
            </a>
          </div>
        </div>

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
              <div key={row.key} className="py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase text-muted-foreground">{row.label}</span>
                  {row.copyable && (
                    <button
                      type="button"
                      className="h-5 w-5 shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => copyValue(row.key, row.value, row.copyText)}
                      aria-label={`${t('txDetails.copy')} ${row.label}`}
                    >
                      {copiedKey === row.key ? (
                        <CheckIcon className="h-3 w-3" />
                      ) : (
                        <CopyIcon className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
                <div className="break-all font-mono text-xs text-foreground">
                  {formatValue(row.value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default TransactionDetails
