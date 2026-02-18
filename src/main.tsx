import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import './i18n'
import App from './app/app'
import { startActionIconThemeSync } from './lib/extension-icons'

const applyViewportSizing = () => {
  const html = document.documentElement
  const body = document.body
  const root = document.getElementById('root')
  const pathname = window.location.pathname
  const isPopup = pathname.endsWith('popup.html')
  const isSidepanel = pathname.endsWith('sidepanel.html')

  body.dataset.view = isPopup ? 'popup' : isSidepanel ? 'sidepanel' : 'other'

  if (isPopup) {
    html.style.width = '360px'
    html.style.height = '600px'
    html.style.maxHeight = '600px'
    html.style.minWidth = '360px'
    html.style.minHeight = '600px'
    html.style.overflow = 'hidden'

    body.style.width = '360px'
    body.style.height = '600px'
    body.style.maxHeight = '600px'
    body.style.minWidth = '360px'
    body.style.minHeight = '600px'
    body.style.margin = '0'
    body.style.overflow = 'hidden'

    if (root) {
      root.style.width = '360px'
      root.style.height = '600px'
      root.style.maxHeight = '600px'
      root.style.minHeight = '600px'
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

const rootElement = document.getElementById('root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
