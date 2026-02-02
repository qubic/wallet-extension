import { useTranslation } from 'react-i18next'
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

  return (
    <section className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Label htmlFor="language" className="text-sm text-muted-foreground">
          {t('app.language')}
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
    </section>
  )
}

export default Settings
