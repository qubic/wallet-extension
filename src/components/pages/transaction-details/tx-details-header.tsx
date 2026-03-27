import { ExternalLinkIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { buildExplorerObjectUrl } from '@/lib/utils'

type TxDetailsHeaderProps = {
  hash: string
  tick?: number
}

const TxDetailsHeader = ({ hash, tick }: TxDetailsHeaderProps) => {
  const { t } = useTranslation()

  return (
    <>
      <div className="text-xs font-semibold uppercase text-muted-foreground">
        {t('txDetails.title')}
      </div>
      <div className="flex justify-end">
        <a
          href={buildExplorerObjectUrl('tx', hash, tick ? { tick } : undefined)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border/50 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('txDetails.openExplorer')}
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    </>
  )
}

export default TxDetailsHeader
