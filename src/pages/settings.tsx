import { useTranslation } from 'react-i18next'

const Settings = () => {
  const { t } = useTranslation()

  return (
    <section className="screen">
      <div className="screen-header">
        <h2>{t('settings.headline')}</h2>
        <p>{t('settings.subhead')}</p>
      </div>

      <div className="settings-list">
        <label className="setting-item">
          <input type="checkbox" defaultChecked />
          <span>{t('settings.appearance')}</span>
        </label>
        <label className="setting-item">
          <input type="checkbox" />
          <span>{t('settings.notifications')}</span>
        </label>
        <label className="setting-item">
          <input type="checkbox" defaultChecked />
          <span>{t('settings.lock')}</span>
        </label>
      </div>
    </section>
  )
}

export default Settings
