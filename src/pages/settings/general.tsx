import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { Label } from '@/components/ui/label'
import PageHeader from '@/components/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { setLanguage } from '@/i18n'

const General = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-4 pb-4">
        <PageHeader title={t('settings.general.title')} onBack={() => navigate('/settings')} />

        <div className="space-y-3">
          <Label htmlFor="language" className="text-sm text-muted-foreground">
            {t('settings.language')}
          </Label>
          <Select
            value={i18n.language}
            onValueChange={(value) => setLanguage(value as Parameters<typeof setLanguage>[0])}
          >
            <SelectTrigger id="language" className="h-9 w-full text-sm">
              <SelectValue placeholder="English" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="tr">Türkçe</SelectItem>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="theme" className="text-sm text-muted-foreground">
            {t('settings.theme')}
          </Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger id="theme" className="h-9 w-full text-sm">
              <SelectValue placeholder={t('settings.themeDark')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">{t('settings.themeDark')}</SelectItem>
              <SelectItem value="light">{t('settings.themeLight')}</SelectItem>
              <SelectItem value="system">{t('settings.themeSystem')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  )
}

export default General
