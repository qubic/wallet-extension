import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="screen">
      <div className="screen-header">
        <h2>{t('home.headline')}</h2>
        <p>{t('home.subhead')}</p>
      </div>

      <div className="card-grid">
        <article className="card">
          <h3>{t('home.cards.balance')}</h3>
          <p>{t('home.cards.balanceValue')}</p>
        </article>
        <article className="card">
          <h3>{t('home.cards.activity')}</h3>
          <p>{t('home.cards.activityValue')}</p>
        </article>
        <article className="card">
          <h3>{t('home.cards.security')}</h3>
          <p>{t('home.cards.securityValue')}</p>
        </article>
      </div>

      <button className="primary-button" type="button" onClick={() => navigate('/settings')}>
        {t('home.cta')}
      </button>
    </section>
  )
}

export default Home
