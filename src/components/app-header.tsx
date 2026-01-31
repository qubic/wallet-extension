import { motion } from 'framer-motion'
import { PanelRightOpenIcon, SquareArrowOutUpRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type AppHeaderProps = {
  language: string
  onLanguageChange: (value: 'en' | 'es') => void
  onOpenSidePanel: () => void
  onOpenTab: () => void
  title: string
  tagline: string
  languageLabel: string
  openSidePanelLabel: string
  openTabLabel: string
}

const AppHeader = ({
  language,
  onLanguageChange,
  onOpenSidePanel,
  onOpenTab,
  title,
  tagline,
  languageLabel,
  openSidePanelLabel,
  openTabLabel,
}: AppHeaderProps) => {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{tagline}</p>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="secondary"
            onClick={onOpenSidePanel}
            aria-label={openSidePanelLabel}
          >
            <PanelRightOpenIcon className="size-4" />
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button size="icon" variant="secondary" onClick={onOpenTab} aria-label={openTabLabel}>
            <SquareArrowOutUpRightIcon className="size-4" />
          </Button>
        </motion.div>
        <div className="flex flex-col items-end gap-1">
          <Label htmlFor="language">{languageLabel}</Label>
          <Select
            value={language}
            onValueChange={(value) => onLanguageChange(value as 'en' | 'es')}
          >
            <SelectTrigger id="language" className="h-8 w-[76px] text-xs">
              <SelectValue placeholder="EN" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="es">ES</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
