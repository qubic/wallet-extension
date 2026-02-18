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
  row: { key: string; label: string; value: unknown; copyable?: boolean; copyText?: string }
  copiedKey: string | null
  onCopy: (key: string, value: unknown, copyText?: string) => void
}

const TxDetailsRow = ({ row, copiedKey, onCopy }: TxDetailsRowProps) => {
  const { t } = useTranslation()

  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase text-muted-foreground">{row.label}</span>
        {row.copyable && (
          <button
            type="button"
            className="h-5 w-5 shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
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
      <div className="break-all font-mono text-xs text-foreground">{formatValue(row.value)}</div>
    </div>
  )
}

export default TxDetailsRow
export { formatValue }
