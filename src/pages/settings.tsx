import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const Settings = () => {
  const { t } = useTranslation()

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t('settings.headline')}</h2>
        <p className="text-sm text-muted-foreground">{t('settings.subhead')}</p>
      </div>

      <div className="grid gap-3">
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              {t('settings.appearance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label htmlFor="compact-layout" className="text-sm">
              {t('settings.appearance')}
            </Label>
            <Switch id="compact-layout" defaultChecked />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              {t('settings.notifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label htmlFor="enable-notifications" className="text-sm">
              {t('settings.notifications')}
            </Label>
            <Switch id="enable-notifications" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">{t('settings.lock')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label htmlFor="auto-lock" className="text-sm">
              {t('settings.lock')}
            </Label>
            <Switch id="auto-lock" defaultChecked />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default Settings
