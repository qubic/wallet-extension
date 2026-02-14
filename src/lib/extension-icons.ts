type ThemePreference = 'light' | 'dark' | 'system'

const LIGHT_ICON_PATHS = {
  16: 'icons/light-16.png',
  32: 'icons/light-32.png',
  48: 'icons/light-48.png',
  128: 'icons/light-128.png',
} as const

const DARK_ICON_PATHS = {
  16: 'icons/dark-16.png',
  32: 'icons/dark-32.png',
  48: 'icons/dark-48.png',
  128: 'icons/dark-128.png',
} as const

const readThemePreference = (): ThemePreference => {
  try {
    const value = localStorage.getItem('theme')
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value
    }
  } catch {
    // ignore localStorage access failures
  }
  return 'system'
}

const resolveTheme = (
  preference: ThemePreference,
  mediaQuery: MediaQueryList,
): 'light' | 'dark' => {
  if (preference === 'system') {
    return mediaQuery.matches ? 'dark' : 'light'
  }
  return preference
}

const applyIcon = (mode: 'light' | 'dark') => {
  const chromeApi = (
    globalThis as typeof globalThis & {
      chrome?: {
        action?: {
          setIcon?: (details: { path: Record<number, string> }) => void | Promise<void>
        }
      }
    }
  ).chrome

  const setIcon = chromeApi?.action?.setIcon
  if (!setIcon) return

  const result = setIcon({ path: mode === 'dark' ? DARK_ICON_PATHS : LIGHT_ICON_PATHS })
  if (result && typeof (result as Promise<void>).catch === 'function') {
    void (result as Promise<void>).catch(() => {
      // ignore icon update failures
    })
  }
}

export const startActionIconThemeSync = () => {
  const chromeApi = (
    globalThis as typeof globalThis & {
      chrome?: { action?: { setIcon?: unknown } }
    }
  ).chrome

  if (!chromeApi?.action?.setIcon || !globalThis.matchMedia) return

  const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)')
  const updateIcon = () => {
    const mode = resolveTheme(readThemePreference(), mediaQuery)
    applyIcon(mode)
  }

  updateIcon()

  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'theme') {
      updateIcon()
    }
  }

  globalThis.addEventListener('storage', handleStorage)

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', updateIcon)
    return () => {
      globalThis.removeEventListener('storage', handleStorage)
      mediaQuery.removeEventListener('change', updateIcon)
    }
  }

  if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(updateIcon)
    return () => {
      globalThis.removeEventListener('storage', handleStorage)
      mediaQuery.removeListener(updateIcon)
    }
  }

  return () => {
    globalThis.removeEventListener('storage', handleStorage)
  }
}
