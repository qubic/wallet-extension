import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import './i18n'
import App from './app/app'

const applyPopupSizing = () => {
  const html = document.documentElement
  const body = document.body

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
}

applyPopupSizing()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
