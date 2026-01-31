import type { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion } from 'framer-motion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HistoryIcon, HomeIcon, PanelRightOpenIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { setLanguage } from '../i18n'

const AppShell = ({ children, showNav = true }: PropsWithChildren<{ showNav?: boolean }>) => {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const isHome = pathname.startsWith('/home')
  const isHistory = pathname.startsWith('/history')
  const isAccounts = pathname.startsWith('/accounts')
  const isSettings = pathname.startsWith('/settings')
  const isSidePanel = globalThis.location?.pathname?.endsWith('sidepanel.html')

  const openSidePanel = async () => {
    const chromeApi = (
      globalThis as typeof globalThis & {
        chrome?: {
          sidePanel?: { open?: (options: { windowId?: number }) => Promise<void> }
          windows?: { getCurrent?: () => Promise<{ id?: number }>; WINDOW_ID_CURRENT?: number }
        }
      }
    ).chrome

    if (!chromeApi?.sidePanel?.open) {
      return
    }

    let windowId: number | undefined

    if (chromeApi.windows?.getCurrent) {
      try {
        const currentWindow = await chromeApi.windows.getCurrent()
        windowId = currentWindow.id
      } catch {
        windowId = undefined
      }
    }

    if (windowId == null) {
      windowId = chromeApi.windows?.WINDOW_ID_CURRENT
    }

    if (windowId == null) {
      return
    }

    await chromeApi.sidePanel.open({ windowId })
  }

  const navItems = [
    {
      key: 'home',
      to: '/home',
      label: t('nav.home'),
      isActive: isHome,
      icon: <HomeIcon className="size-5" />,
    },
    {
      key: 'history',
      to: '/history',
      label: t('home.actions.history'),
      isActive: isHistory,
      icon: <HistoryIcon className="size-5" />,
    },
    {
      key: 'accounts',
      to: '/accounts',
      label: t('nav.accounts'),
      isActive: isAccounts,
      icon: <UsersIcon className="size-5" />,
    },
    {
      key: 'settings',
      to: '/settings',
      label: t('nav.settings'),
      isActive: isSettings,
      icon: <SettingsIcon className="size-5" />,
    },
  ]

  return (
    <div className="flex h-full w-full flex-col bg-[radial-gradient(circle_at_top,_#1f2e34_0%,_#0f1418_55%,_#0b0f12_100%)]">
      <div className="flex flex-1 flex-col gap-4 p-0">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t('app.tagline')}
            </p>
            <h1 className="text-xl font-semibold">{t('app.title')}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Button
              size="icon"
              variant="secondary"
              onClick={openSidePanel}
              aria-label={t('app.sidepanel')}
            >
              <PanelRightOpenIcon className="size-4" />
            </Button>
            <div className="flex flex-col items-end gap-1">
              <Label htmlFor="language">{t('app.language')}</Label>
              <Select
                value={i18n.language}
                onValueChange={(value) => setLanguage(value as 'en' | 'es')}
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

        <Card className="flex min-h-0 flex-1 flex-col border-border/60 bg-card/80">
          <ScrollArea className="flex-1">
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-0">{children}</CardContent>
          </ScrollArea>
        </Card>
      </div>

      {showNav && (
        <nav
          className={`fixed bottom-0 left-0 right-0 grid items-center gap-1 rounded-none border-t border-border/60 bg-card/90 p-1 shadow-lg backdrop-blur ${
            isSidePanel ? 'grid-cols-4' : 'grid-cols-4'
          }`}
        >
          {navItems.map((item) => (
            <Button
              key={item.key}
              asChild
              size="icon"
              variant="ghost"
              className="h-11 w-full p-0"
              aria-label={item.label}
            >
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className="relative flex h-10 w-full items-center justify-center rounded-full transition-colors hover:bg-muted/40"
              >
                {item.isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-1 rounded-full bg-[var(--accent)]/20"
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  />
                )}
                <motion.span
                  initial={false}
                  animate={{
                    scale: item.isActive ? 1.05 : 1,
                    opacity: item.isActive ? 1 : 0.75,
                  }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className="relative text-[var(--accent)]"
                >
                  {item.icon}
                </motion.span>
              </NavLink>
            </Button>
          ))}
        </nav>
      )}
    </div>
  )
}

export default AppShell
