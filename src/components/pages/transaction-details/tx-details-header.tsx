import { CheckIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { buildExplorerObjectUrl, truncateString } from '@/lib/utils'

type TxDetailsHeaderProps = {
  hash: string
  copiedKey: string | null
  onCopy: (key: string, value: unknown) => void
}

const TxDetailsHeader = ({ hash, copiedKey, onCopy }: TxDetailsHeaderProps) => {
  const { t } = useTranslation()

  return (
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
          onClick={() => onCopy('hash', hash)}
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
  )
}

export default TxDetailsHeader
