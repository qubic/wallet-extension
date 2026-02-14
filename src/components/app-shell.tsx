import type { PropsWithChildren } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
  const navRef = useRef<HTMLElement | null>(null)
  const navItemRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const [activeIndicator, setActiveIndicator] = useState<{ x: number; width: number }>({
    x: 0,
    width: 0,
  })

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

  const navItems = useMemo(
    () => [
      {
        key: 'home',
        to: '/home',
        label: t('nav.home'),
        icon: <HomeIcon className="size-5" />,
      },
      {
        key: 'history',
        to: '/history',
        label: t('home.actions.history'),
        icon: <HistoryIcon className="size-5" />,
      },
      {
        key: 'transfer',
        to: '/transfer',
        label: t('nav.transfer'),
        icon: <ArrowLeftRightIcon className="size-5" />,
      },
      {
        key: 'accounts',
        to: '/accounts',
        label: t('nav.accounts'),
        icon: <UsersIcon className="size-5" />,
      },
      {
        key: 'settings',
        to: '/settings',
        label: t('nav.settings'),
        icon: <SettingsIcon className="size-5" />,
      },
    ],
    [t],
  )

  const getActiveNavIndex = useCallback(() => {
    return navItems.findIndex((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
  }, [navItems, pathname])

  const updateActiveIndicator = useCallback(() => {
    const activeIndex = getActiveNavIndex()
    const navElement = navRef.current
    const activeElement = navItemRefs.current[activeIndex]
    if (!navElement || !activeElement) return
    const navRect = navElement.getBoundingClientRect()
    const activeRect = activeElement.getBoundingClientRect()
    setActiveIndicator({
      x: activeRect.left - navRect.left,
      width: activeRect.width,
    })
  }, [getActiveNavIndex])

  const activeNavIndex = getActiveNavIndex()

  useLayoutEffect(() => {
    updateActiveIndicator()
  }, [updateActiveIndicator])

  useEffect(() => {
    const handleResize = () => updateActiveIndicator()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateActiveIndicator])

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
          className={showNav ? 'h-full pb-10' : 'h-full'}
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
          ref={navRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.03 }}
          className={`relative z-20 grid h-[56px] shrink-0 items-center gap-0 overflow-visible rounded-t-2xl border-t border-border/60 bg-background/95 px-0 py-0 shadow-[0_-10px_25px_-18px_hsl(var(--primary)/0.45)] backdrop-blur supports-[backdrop-filter]:bg-background/82 ${
            isSidePanel ? 'grid-cols-5' : 'grid-cols-5'
          }`}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-0"
            animate={{ x: activeIndicator.x, width: activeIndicator.width }}
            transition={{ type: 'spring', stiffness: 560, damping: 38, mass: 0.68 }}
          >
            <motion.div
              key={pathname}
              className="absolute inset-x-[4px] inset-y-[4px] rounded-2xl border border-primary/45 bg-primary/16 shadow-[0_10px_20px_-14px_hsl(var(--primary)/0.9)]"
              initial={{ scaleY: 0.88, scaleX: 0.94, opacity: 0.72 }}
              animate={{ scaleY: 1, scaleX: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            />
          </motion.div>

          {navItems.map((item, index) => (
            <Button
              key={item.key}
              asChild
              size="icon"
              variant="ghost"
              className="relative z-10 h-full w-full rounded-none p-0 shadow-none hover:bg-transparent dark:hover:bg-transparent"
              aria-label={item.label}
            >
              <NavLink
                ref={(element) => {
                  navItemRefs.current[index] = element
                }}
                to={item.to}
                end={item.to === '/'}
                className="group relative flex h-full w-full items-center justify-center rounded-none transition-colors"
              >
                {({ isActive }) => (
                  <motion.div
                    className="relative flex h-full w-full items-center justify-center"
                    initial={false}
                    animate={{
                      y: isActive ? -1 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                  >
                    {!isActive && (
                      <span className="pointer-events-none absolute inset-[4px] rounded-2xl border border-primary/25 bg-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    )}
                    <motion.span
                      initial={false}
                      animate={{
                        scale:
                          index === activeNavIndex
                            ? 1.12
                            : Math.abs(index - activeNavIndex) === 1
                              ? 1.03
                              : 1,
                        rotate: isActive ? [0, -6, 0] : 0,
                        opacity: isActive ? 1 : 0.7,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 320,
                        damping: 18,
                        duration: isActive ? 0.52 : 0.24,
                      }}
                      className={`relative transition-colors ${isActive ? 'text-primary' : 'dark:text-white/80 dark:group-hover:text-white'}`}
                    >
                      {item.icon}
                    </motion.span>
                  </motion.div>
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
