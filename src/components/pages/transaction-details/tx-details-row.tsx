import type React from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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

type TxDetailsRowProps = {
  row: {
    key: string
    label: string
    value: unknown
    title?: string
    copyable?: boolean
    copyText?: string
    icon?: React.ReactNode
  }
  copiedKey: string | null
  onCopy: (key: string, value: unknown, copyText?: string) => void
}

const TxDetailsRow = ({ row, copiedKey, onCopy }: TxDetailsRowProps) => {
  const { t } = useTranslation()

  return (
    <div className="py-2">
      <div className="mb-1">
        <span className="text-[11px] uppercase text-muted-foreground">{row.label}</span>
      </div>
      <div className="flex items-start gap-1.5">
        {row.icon && <span className="mt-0.5 shrink-0">{row.icon}</span>}
        <div className="min-w-0 break-all font-mono text-xs text-foreground" title={row.title}>
          {formatValue(row.value)}
        </div>
        {row.copyable && (
          <button
            type="button"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onCopy(row.key, row.value, row.copyText)}
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
    </div>
  )
}

export default TxDetailsRow
export { formatValue }
