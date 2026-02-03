import { motion } from 'framer-motion'
import { PanelRightOpenIcon, SquareArrowOutUpRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AppHeaderProps = {
  onOpenSidePanel: () => void
  onOpenTab: () => void
  title: string
  openSidePanelLabel: string
  openTabLabel: string
}

const AppHeader = ({
  onOpenSidePanel,
  onOpenTab,
  title,
  openSidePanelLabel,
  openTabLabel,
}: AppHeaderProps) => {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-4 -mb-2 border-b-1">
      <div className="flex items-center gap-2">
        <img src="/branding/Qubic-Symbol-White.svg" alt="Qubic" className="h-5" />
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            onClick={onOpenSidePanel}
            aria-label={openSidePanelLabel}
          >
            <PanelRightOpenIcon className="size-4" />
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button size="icon" variant="ghost" onClick={onOpenTab} aria-label={openTabLabel}>
            <SquareArrowOutUpRightIcon className="size-4" />
          </Button>
        </motion.div>
      </div>
    </header>
  )
}

export default AppHeader
