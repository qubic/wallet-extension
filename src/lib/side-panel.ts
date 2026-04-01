type ChromeSidePanelApi = {
  open?: (options: { windowId?: number }) => Promise<void>
  close?: (options: { windowId?: number }) => Promise<void>
}

type ChromeWindowsApi = {
  getCurrent?: () => Promise<{ id?: number }>
  WINDOW_ID_CURRENT?: number
}

type ChromeApi = {
  sidePanel?: ChromeSidePanelApi
  windows?: ChromeWindowsApi
}

export const getExtensionViewKind = (): 'popup' | 'sidepanel' | 'other' => {
  if (typeof window === 'undefined') return 'other'
  const { pathname } = window.location
  if (pathname.endsWith('popup.html')) return 'popup'
  if (pathname.endsWith('sidepanel.html')) return 'sidepanel'
  return 'other'
}

const getChromeApi = (): ChromeApi | undefined =>
  (
    globalThis as typeof globalThis & {
      chrome?: ChromeApi
    }
  ).chrome

const getCurrentWindowId = async (chromeApi: ChromeApi): Promise<number | undefined> => {
  if (chromeApi.windows?.getCurrent) {
    try {
      const currentWindow = await chromeApi.windows.getCurrent()
      if (currentWindow.id != null) return currentWindow.id
    } catch {
      // Fallback below when Chrome cannot resolve the current window id.
    }
  }

  return chromeApi.windows?.WINDOW_ID_CURRENT
}

export const toggleCurrentWindowSidePanel = async (): Promise<void> => {
  const chromeApi = getChromeApi()
  const viewKind = getExtensionViewKind()

  if (!chromeApi?.sidePanel) {
    if (viewKind === 'sidepanel') {
      window.close()
    }
    return
  }

  const windowId = await getCurrentWindowId(chromeApi)

  if (viewKind === 'sidepanel') {
    if (windowId != null && chromeApi.sidePanel.close) {
      await chromeApi.sidePanel.close({ windowId })
      return
    }
    window.close()
    return
  }

  if (!chromeApi.sidePanel.open || windowId == null) {
    return
  }

  await chromeApi.sidePanel.open({ windowId })

  if (viewKind === 'popup') {
    requestAnimationFrame(() => window.close())
  }
}
