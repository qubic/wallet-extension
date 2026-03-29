import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { TransferRightsIcon } from '@/components/icons/transfer-rights-icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type TransferRightsButtonProps = {
  onClick: (e: React.MouseEvent) => void
  className?: string
}

const TransferRightsButton = ({ onClick, className }: TransferRightsButtonProps) => {
  const { t } = useTranslation()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn('h-8 w-8 shrink-0 text-muted-foreground', className)}
          onClick={onClick}
        >
          <TransferRightsIcon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('assetDetail.transferRights')}</TooltipContent>
    </Tooltip>
  )
}

export default TransferRightsButton
