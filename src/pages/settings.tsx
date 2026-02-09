import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { setLanguage } from '@/i18n'
import { getLockTimeoutMinutes, lockWallet, setLockTimeoutMinutes } from '@/lib/lock'

const Settings = () => {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [lockMinutes, setLockMinutes] = useState(() => getLockTimeoutMinutes())

  useEffect(() => {
    setLockMinutes(getLockTimeoutMinutes())
  }, [])

  const handleLockNow = () => {
    lockWallet()
    navigate('/unlock')
  }

  const handleTimeoutChange = (value: string) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) {
      setLockMinutes(0)
      return
    }
    setLockMinutes(parsed)
    if (parsed > 0) {
      setLockTimeoutMinutes(parsed)
    }
  }

  return (
    <section className="flex min-h-full w-full justify-center pb-6 pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-6">
        <div className="space-y-3">
          <Label htmlFor="language" className="text-sm text-muted-foreground">
            {t('settings.language')}
          </Label>
          <Select
            value={i18n.language}
            onValueChange={(value) => setLanguage(value as 'en' | 'es')}
          >
            <SelectTrigger id="language" className="h-9 w-full text-sm">
              <SelectValue placeholder="EN" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="es">ES</SelectItem>
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

        <div className="space-y-3">
          <Label htmlFor="lock-timeout" className="text-sm text-muted-foreground">
            {t('settings.lockTimeout.label')}
          </Label>
          <Input
            id="lock-timeout"
            type="number"
            min={1}
            max={120}
            value={Number.isFinite(lockMinutes) ? lockMinutes : ''}
            onChange={(event) => handleTimeoutChange(event.target.value)}
            onBlur={() => {
              if (lockMinutes <= 0) {
                setLockMinutes(getLockTimeoutMinutes())
              }
            }}
          />
          <p className="text-xs text-muted-foreground">{t('settings.lockTimeout.helper')}</p>
        </div>

        <Button variant="outline" onClick={handleLockNow}>
          {t('settings.lockNow')}
        </Button>
      </div>
    </section>
  )
}

export default Settings
