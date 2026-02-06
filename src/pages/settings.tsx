import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { setLanguage } from '@/i18n'

const Settings = () => {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <section className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Language selector */}
        <div className="flex flex-col items-center gap-3">
          <Label htmlFor="language" className="text-sm text-muted-foreground">
            {t('settings.language')}
          </Label>
          <Select value={i18n.language} onValueChange={(value) => setLanguage(value as 'en' | 'es')}>
            <SelectTrigger id="language" className="h-9 w-[120px] text-sm">
              <SelectValue placeholder="EN" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="es">ES</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Theme selector */}
        <div className="flex flex-col items-center gap-3">
          <Label htmlFor="theme" className="text-sm text-muted-foreground">
            {t('settings.theme')}
          </Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger id="theme" className="h-9 w-[120px] text-sm">
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

export default Settings
