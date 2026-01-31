import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const History = () => {
  const { t } = useTranslation()

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t('home.actions.history')}</h2>
        <p className="text-sm text-muted-foreground">Transaction history placeholder.</p>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground">Latest activity</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">No transactions yet.</CardContent>
      </Card>
    </section>
  )
}

export default History
