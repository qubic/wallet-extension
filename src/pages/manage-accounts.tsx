import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ManageAccounts = () => {
  const { t } = useTranslation()

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t('nav.accounts')}</h2>
        <p className="text-sm text-muted-foreground">Manage wallet accounts placeholder.</p>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground">Primary account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm">
            <p className="font-semibold">Main wallet</p>
            <p className="text-xs text-muted-foreground">QUBIC-XXXX-XXXX</p>
          </div>
          <Button size="sm" variant="secondary">
            Edit
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline">Add account</Button>
    </section>
  )
}

export default ManageAccounts
