import type { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion } from 'framer-motion'
import { ArrowLeftRightIcon, HistoryIcon, HomeIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import AppHeader from '@/components/app-header'

const AppShell = ({
  children,
  showNav = true,
  showHeader = true,
}: PropsWithChildren<{ showNav?: boolean; showHeader?: boolean }>) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const isHome = pathname.startsWith('/home')
  const isTransfer = pathname.startsWith('/transfer')
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
      icon: <HomeIcon className="size-6" />,
    },
    {
      key: 'history',
      to: '/history',
      label: t('home.actions.history'),
      isActive: isHistory,
      icon: <HistoryIcon className="size-6" />,
    },
    {
      key: 'transfer',
      to: '/transfer',
      label: t('nav.transfer'),
      isActive: isTransfer,
      icon: <ArrowLeftRightIcon className="size-6" />,
    },
    {
      key: 'accounts',
      to: '/accounts',
      label: t('nav.accounts'),
      isActive: isAccounts,
      icon: <UsersIcon className="size-6" />,
    },
    {
      key: 'settings',
      to: '/settings',
      label: t('nav.settings'),
      isActive: isSettings,
      icon: <SettingsIcon className="size-6" />,
    },
  ]

  const openTab = async () => {
    const chromeApi = (
      globalThis as typeof globalThis & {
        chrome?: { tabs?: { create?: (options: { url: string }) => Promise<void> } }
      }
    ).chrome

    if (!chromeApi?.tabs?.create) {
      return
    }

    await chromeApi.tabs.create({ url: 'tab.html' })
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {showHeader && (
        <AppHeader
          onOpenSidePanel={openSidePanel}
          onOpenTab={openTab}
          openSidePanelLabel={t('app.sidepanel')}
          openTabLabel={t('app.opentab')}
        />
      )}

      {showHeader || showNav ? (
        <div className="app-scrollbar flex-1 min-h-0 overflow-y-auto">
          <div className="min-h-full">{children}</div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">{children}</div>
      )}

      {showNav && (
        <nav
          className={`z-20 grid h-[56px] shrink-0 items-center gap-1 rounded-none border-t border-border/60 bg-[rgb(17,17,17)] shadow-lg backdrop-blur ${
            isSidePanel ? 'grid-cols-5' : 'grid-cols-5'
          }`}
        >
          {navItems.map((item) => (
            <Button
              key={item.key}
              asChild
              size="icon"
              variant="ghost"
              className="h-full w-full p-0"
              aria-label={item.label}
            >
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className="relative flex h-full w-full items-center justify-center transition-colors hover:bg-muted/30"
              >
                {item.isActive && <span className="absolute inset-0 bg-[var(--accent)]/20" />}
                <motion.span
                  initial={false}
                  animate={{
                    scale: item.isActive ? [1, 1.12, 1] : 1,
                    rotate: item.isActive ? [0, 360] : 0,
                    opacity: item.isActive ? 1 : 0.7,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 18,
                    duration: item.isActive ? 0.6 : 0.2,
                  }}
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
