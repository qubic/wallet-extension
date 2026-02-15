import { InboxIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const HistoryEmptyState = () => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-transparent px-3 py-3 text-xs text-muted-foreground">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-transparent text-muted-foreground">
        <InboxIcon className="h-4 w-4" />
      </div>
      <div>{t('history.empty')}</div>
    </div>
  )
}

export default HistoryEmptyState
