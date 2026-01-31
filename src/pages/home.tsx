import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HistoryIcon, UsersIcon } from 'lucide-react'

const Home = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t('home.headline')}</h2>
        <p className="text-sm text-muted-foreground">{t('home.subhead')}</p>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3">
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              {t('home.cards.balance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-semibold">
            {t('home.cards.balanceValue')}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              {t('home.cards.activity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-semibold">
            {t('home.cards.activityValue')}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70 col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              {t('home.cards.security')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-semibold">
            {t('home.cards.securityValue')}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="justify-start gap-2"
          onClick={() => navigate('/history')}
        >
          <HistoryIcon className="size-4" />
          {t('home.actions.history')}
        </Button>
        <Button
          variant="secondary"
          className="justify-start gap-2"
          onClick={() => navigate('/accounts')}
        >
          <UsersIcon className="size-4" />
          {t('home.actions.accounts')}
        </Button>
      </div>

      <Button type="button" onClick={() => navigate('/settings')}>
        {t('home.cta')}
      </Button>
    </section>
  )
}

export default Home
