import { CopyIcon } from 'lucide-react'

type SummaryRowProps = {
  label: string
  value: string
  valueTitle?: string
  mono?: boolean
  emphasize?: boolean
  copyLabel?: string
  onCopy?: () => void
}

const SummaryRow = ({
  label,
  value,
  valueTitle,
  mono = false,
  emphasize = false,
  copyLabel,
  onCopy,
}: SummaryRowProps) => (
  <div className="space-y-1 border-t border-border/40 pt-3 first:border-t-0 first:pt-0">
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
      <span>{label}</span>
      {onCopy && copyLabel && (
        <button
          type="button"
          className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          onClick={onCopy}
          aria-label={copyLabel}
        >
          <CopyIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
    <div
      title={valueTitle}
      className={`break-all ${mono ? 'font-mono' : ''} ${
        emphasize ? 'text-lg font-semibold tabular-nums text-foreground' : 'text-sm text-foreground'
      }`}
    >
      {value}
    </div>
  </div>
)

export default SummaryRow
