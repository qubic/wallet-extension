import {
  CheckIcon,
  EyeIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShieldCheckIcon,
  TrashIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatBalanceCompact, truncateString } from '@/lib/utils'
import { HIDDEN_BALANCE, useBalanceVisibility } from '@/lib/balance-visibility'
import type { AccountEntry } from '@/components/pages/manage-accounts/types'

type AccountListItemProps = {
  account: AccountEntry
  balance?: bigint
  isActive: boolean
  isDragging: boolean
  isOver: boolean
  canRemoveAnyAccount: boolean
  onDragStart: (event: React.DragEvent) => void
  onDragOver: (event: React.DragEvent) => void
  onDrop: (event: React.DragEvent) => void
  onDragEnd: () => void
  onRequestRename: (account: AccountEntry) => void
  onSelect: (account: AccountEntry) => void
  onReveal: (account: AccountEntry) => void
  onRemove: (account: AccountEntry) => void
}

const AccountListItem = ({
  account,
  balance,
  isActive,
  isDragging,
  isOver,
  canRemoveAnyAccount,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRequestRename,
  onSelect,
  onReveal,
  onRemove,
}: AccountListItemProps) => {
  const { t } = useTranslation()
  const { isVisible } = useBalanceVisibility()

  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onRequestRename(account)
        }
      }}
      aria-label={`${t('accounts.manage.menu')} ${account.name}`}
      className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/80 pl-2 pr-3 py-2 ${
        isOver ? 'ring-2 ring-primary/40' : ''
      } ${isDragging ? 'opacity-60' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {account.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {account.watchOnly && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-200">
                <EyeIcon className="h-2.5 w-2.5" />
                {t('accounts.manage.watchOnly')}
              </span>
            )}
            {isActive && (
              <span className="shrink-0 text-[11px] text-primary">
                {t('accounts.manage.active')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">
            {truncateString(account.identity, { leading: 5, trailing: 5 })}
          </span>
          <span className="text-[11px] font-semibold text-foreground">
            {isVisible
              ? balance !== undefined
                ? formatBalanceCompact(balance)
                : '--'
              : HIDDEN_BALANCE}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" aria-label={t('accounts.manage.drag')}>
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label={t('accounts.manage.menu')}>
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSelect(account)}>
              <CheckIcon className="h-4 w-4" />
              {t('accounts.manage.select')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRequestRename(account)}>
              <PencilIcon className="h-4 w-4" />
              {t('accounts.manage.rename')}
            </DropdownMenuItem>
            {!account.watchOnly && (
              <DropdownMenuItem onClick={() => onReveal(account)}>
                <ShieldCheckIcon className="h-4 w-4" />
                {t('accounts.manage.reveal')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={!canRemoveAnyAccount}
              onClick={() => onRemove(account)}
            >
              <TrashIcon className="h-4 w-4" />
              {t('accounts.manage.remove')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </button>
  )
}

export default AccountListItem
