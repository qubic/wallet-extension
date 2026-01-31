import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import './i18n'
import App from './app/app'

const applyViewportSizing = () => {
  const html = document.documentElement
  const body = document.body
  const pathname = window.location.pathname
  const isPopup = pathname.endsWith('popup.html')

  if (isPopup) {
    html.style.width = '360px'
    html.style.height = '520px'
    html.style.minWidth = '360px'
    html.style.minHeight = '520px'
    html.style.overflow = 'hidden'

    body.style.width = '100%'
    body.style.height = '100%'
    body.style.minWidth = '360px'
    body.style.minHeight = '520px'
    body.style.margin = '0'
    body.style.overflow = 'hidden'
  } else {
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
  }
}

applyViewportSizing()

const rootElement = document.getElementById('root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
