import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setLanguage } from '../i18n'

const AppShell = ({ children }: PropsWithChildren) => {
  const { t, i18n } = useTranslation()

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">{t('app.tagline')}</p>
          <h1 className="app-title">{t('app.title')}</h1>
        </div>
        <div className="lang-select">
          <label htmlFor="language">{t('app.language')}</label>
          <select
            id="language"
            value={i18n.language}
            onChange={(event) => setLanguage(event.target.value as 'en' | 'es')}
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </div>
      </header>

      <nav className="app-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-link${isActive ? ' nav-link-active' : ''}`
          }
        >
          {t('nav.home')}
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `nav-link${isActive ? ' nav-link-active' : ''}`
          }
        >
          {t('nav.settings')}
        </NavLink>
      </nav>

      <main className="app-main">{children}</main>
    </div>
  )
}

export default AppShell
