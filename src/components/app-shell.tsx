import type { PropsWithChildren } from 'react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
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
  const isSidePanel = globalThis.location?.pathname?.endsWith('sidepanel.html')
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!pathname) return
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

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
      icon: <HomeIcon className="size-6" />,
    },
    {
      key: 'history',
      to: '/history',
      label: t('home.actions.history'),
      icon: <HistoryIcon className="size-6" />,
    },
    {
      key: 'transfer',
      to: '/transfer',
      label: t('nav.transfer'),
      icon: <ArrowLeftRightIcon className="size-6" />,
    },
    {
      key: 'accounts',
      to: '/accounts',
      label: t('nav.accounts'),
      icon: <UsersIcon className="size-6" />,
    },
    {
      key: 'settings',
      to: '/settings',
      label: t('nav.settings'),
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
    <div className="relative flex h-full max-h-full w-full flex-col overflow-hidden bg-background">
      {showHeader && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <AppHeader
            onOpenSidePanel={openSidePanel}
            onOpenTab={openTab}
            openSidePanelLabel={t('app.sidepanel')}
            openTabLabel={t('app.opentab')}
          />
        </motion.div>
      )}

      <motion.div
        ref={scrollContainerRef}
        className="app-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingRight: '12px',
          marginRight: '-12px',
        }}
      >
        <div
          className={showNav ? 'min-h-full pb-10' : 'min-h-full'}
          style={{
            paddingBottom: showNav ? 'calc(24px + env(safe-area-inset-bottom))' : '0',
            scrollPaddingBottom: showNav ? '96px' : '0',
          }}
        >
          {children}
        </div>
      </motion.div>

      {showNav && (
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.03 }}
          className={`z-20 grid h-[56px] shrink-0 items-center gap-1 border-t border-border/60 bg-background/95 px-1 py-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 ${
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
                className="group relative flex h-full w-full items-center justify-center rounded-lg transition-colors hover:bg-primary/10"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="app-nav-active-pill"
                        className="absolute inset-0 rounded-lg border border-primary/35 bg-primary/15"
                        transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.8 }}
                      />
                    )}
                    <motion.span
                      initial={false}
                      animate={{
                        y: isActive ? [0, -1, 0] : 0,
                        opacity: isActive ? 1 : 0.72,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 16,
                        duration: isActive ? 0.48 : 0.18,
                      }}
                      className={`relative transition-colors ${isActive ? 'text-primary' : 'dark:text-white/80 dark:group-hover:text-white'}`}
                    >
                      {item.icon}
                    </motion.span>
                  </>
                )}
              </NavLink>
            </Button>
          ))}
        </motion.nav>
      )}
    </div>
  )
}

export default AppShell
