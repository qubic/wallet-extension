import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const Welcome = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    localStorage.setItem('hasAccount', 'true')
    navigate('/home')
  }

  return (
    <section className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t('nav.welcome')}</h2>
        <p className="text-sm text-muted-foreground">Work in progress</p>
      </div>

      <Button className="w-40" onClick={handleGetStarted}>
        {t('nav.accounts')}
      </Button>
    </section>
  )
}

export default Welcome
