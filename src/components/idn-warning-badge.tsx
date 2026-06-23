import { TriangleAlertIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { hasIdnHostname } from '@/lib/utils'

type Props = { origin: string }

const IdnWarningBadge = ({ origin }: Props) => {
  const { t } = useTranslation()
  if (!hasIdnHostname(origin)) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
      <TriangleAlertIcon className="h-3 w-3" />
      {t('dapp.idnWarning')}
    </span>
  )
}

export default IdnWarningBadge
