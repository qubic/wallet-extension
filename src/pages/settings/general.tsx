import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { ArrowLeftIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
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
      <div className="flex w-full max-w-sm flex-col gap-6 px-4">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('settings.general.back')}
        </button>

        <h2 className="text-base font-semibold">{t('settings.general.title')}</h2>

        <div className="space-y-3">
          <Label htmlFor="language" className="text-sm text-muted-foreground">
            {t('settings.language')}
          </Label>
          <Select
            value={i18n.language}
            onValueChange={(value) => setLanguage(value as 'en' | 'es')}
          >
            <SelectTrigger id="language" className="h-9 w-full text-sm">
              <SelectValue placeholder="English" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
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
