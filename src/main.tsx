import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import './i18n'
import App from './app/app'
import { startActionIconThemeSync } from './lib/extension-icons'
import { startDappSidepanelPresenceHeartbeat } from './lib/dapp/sidepanel-presence'
import { startDappSessionSync } from './lib/dapp/session-sync'
import { syncVaultStorageMirror } from './lib/vault'
import {
  DAPP_APPROVAL_POPUP_HEIGHT_PX,
  DAPP_APPROVAL_POPUP_WIDTH_PX,
  DAPP_APPROVAL_QUERY_PARAM,
  DAPP_APPROVAL_QUERY_VALUE,
  TOOLBAR_POPUP_HEIGHT_PX,
  TOOLBAR_POPUP_WIDTH_PX,
} from './lib/config/constants'

const applyViewportSizing = () => {
  const html = document.documentElement
  const body = document.body
  const root = document.getElementById('root')
  const pathname = window.location.pathname
  const isPopup = pathname.endsWith('popup.html')
  const isSidepanel = pathname.endsWith('sidepanel.html')
  const isDappApproval =
    isPopup &&
    new URLSearchParams(window.location.search).get(DAPP_APPROVAL_QUERY_PARAM) ===
      DAPP_APPROVAL_QUERY_VALUE

  body.dataset.view = isPopup ? 'popup' : isSidepanel ? 'sidepanel' : 'other'

  if (isPopup) {
    const width = isDappApproval ? DAPP_APPROVAL_POPUP_WIDTH_PX : TOOLBAR_POPUP_WIDTH_PX
    const height = isDappApproval ? DAPP_APPROVAL_POPUP_HEIGHT_PX : TOOLBAR_POPUP_HEIGHT_PX
    const widthPx = `${width}px`
    const heightPx = `${height}px`

    html.style.width = widthPx
    html.style.height = heightPx
    html.style.maxHeight = heightPx
    html.style.minWidth = widthPx
    html.style.minHeight = heightPx
    html.style.overflow = 'hidden'

    body.style.width = widthPx
    body.style.height = heightPx
    body.style.maxHeight = heightPx
    body.style.minWidth = widthPx
    body.style.minHeight = heightPx
    body.style.margin = '0'
    body.style.overflow = 'hidden'

    if (root) {
      root.style.width = widthPx
      root.style.height = heightPx
      root.style.maxHeight = heightPx
      root.style.minHeight = heightPx
      root.style.overflow = 'hidden'
    }
    return
  }

  html.style.width = '100%'
  html.style.height = '100%'
  html.style.minWidth = '100%'
  html.style.minHeight = '100%'
  html.style.overflow = 'hidden'

  body.style.width = '100%'
  body.style.height = '100%'
  body.style.minWidth = '100%'
  body.style.minHeight = '100%'
  body.style.margin = '0'
  body.style.overflow = 'hidden'

  if (root) {
    root.style.width = '100%'
    root.style.height = '100%'
    root.style.maxHeight = '100%'
    root.style.minHeight = '100%'
    root.style.overflow = 'hidden'
  }
}

applyViewportSizing()

const startExtensionReloadWatcher = () => {
  if (import.meta.env.MODE !== 'extension') return

  const chromeApi = (
    globalThis as typeof globalThis & {
      chrome?: { runtime?: { getURL?: (path: string) => string } }
    }
  ).chrome
  const getUrl = chromeApi?.runtime?.getURL
  if (!getUrl) return

  let lastBuildId: number | null = null
  const reloadUrl = getUrl('reload.json')

  const check = async () => {
    try {
      const response = await fetch(reloadUrl, { cache: 'no-store' })
      if (!response.ok) return
      const data = (await response.json()) as { buildId?: number }
      if (data.buildId && lastBuildId && data.buildId !== lastBuildId) {
        globalThis.location.reload()
      }
      lastBuildId = data.buildId ?? lastBuildId
    } catch {
      // ignore failed polls during rebuilds
    }
  }

  void check()
  setInterval(check, 1500)
}

startExtensionReloadWatcher()
startActionIconThemeSync()
startDappSessionSync()
if (window.location.pathname.endsWith('sidepanel.html')) {
  startDappSidepanelPresenceHeartbeat()
}
void syncVaultStorageMirror()

const rootElement = document.getElementById('root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
