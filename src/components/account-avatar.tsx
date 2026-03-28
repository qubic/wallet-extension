import BoringAvatar from 'boring-avatars'
import { EyeIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCOUNT_AVATAR_COLORS = [
  '#1ADEF5',
  '#03C1DB',
  '#61F0FE',
  '#0C131B',
  '#152A38',
  '#47CD89',
  '#FABC3C',
]

const SIZE_STYLES = {
  xs: { className: 'h-6 w-6', pixelSize: 24 },
  sm: { className: 'h-8 w-8', pixelSize: 32 },
  md: { className: 'h-10 w-10', pixelSize: 40 },
  lg: { className: 'h-12 w-12', pixelSize: 48 },
} as const

type AccountAvatarProps = {
  identity: string
  name?: string
  watchOnly?: boolean
  size?: keyof typeof SIZE_STYLES
  className?: string
}

const AccountAvatar = ({
  identity,
  name,
  watchOnly = false,
  size = 'md',
  className,
}: AccountAvatarProps) => {
  const { className: sizeClassName, pixelSize } = SIZE_STYLES[size]
  const avatarName = name?.trim() ? `${name}-${identity}` : identity

  return (
    <div className={cn('relative shrink-0', sizeClassName, className)}>
      <BoringAvatar
        size={pixelSize}
        name={avatarName}
        variant="marble"
        colors={ACCOUNT_AVATAR_COLORS}
        className="h-full w-full rounded-full border border-border/60 bg-card"
      />
      {watchOnly && (
        <span className="absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background bg-card text-muted-foreground">
          <EyeIcon className="h-2.5 w-2.5" />
        </span>
      )}
    </div>
  )
}

export default AccountAvatar
