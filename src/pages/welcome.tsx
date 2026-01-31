import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const Welcome = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t('nav.welcome')}</h2>
        <p className="text-sm text-muted-foreground">Welcome to your Qubic wallet extension.</p>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardContent className="space-y-2 text-sm">
          <p>Connect accounts, check history, and manage settings in one place.</p>
          <p>This screen is a placeholder for onboarding content.</p>
        </CardContent>
      </Card>

      <div className="mt-auto flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => navigate('/home')}>
          {t('nav.home')}
        </Button>
        <Button className="flex-1" onClick={() => navigate('/accounts')}>
          {t('nav.accounts')}
        </Button>
      </div>
    </section>
  )
}

export default Welcome
