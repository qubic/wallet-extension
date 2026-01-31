import type { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HistoryIcon, HomeIcon, SettingsIcon, SparklesIcon, UsersIcon } from 'lucide-react'
import { setLanguage } from '../i18n'

const AppShell = ({ children }: PropsWithChildren) => {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const isWelcome = pathname === '/' || pathname === ''
  const isHome = pathname.startsWith('/home')
  const isHistory = pathname.startsWith('/history')
  const isAccounts = pathname.startsWith('/accounts')
  const isSettings = pathname.startsWith('/settings')

  return (
    <div className="flex h-full w-full flex-col gap-4 bg-[radial-gradient(circle_at_top,_#1f2e34_0%,_#0f1418_55%,_#0b0f12_100%)] p-5">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {t('app.tagline')}
          </p>
          <h1 className="text-xl font-semibold">{t('app.title')}</h1>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
          <Label htmlFor="language">{t('app.language')}</Label>
          <Select
            value={i18n.language}
            onValueChange={(value) => setLanguage(value as 'en' | 'es')}
          >
            <SelectTrigger id="language" className="h-8 w-[76px] text-xs">
              <SelectValue placeholder="EN" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="es">ES</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {children}
        </CardContent>
      </Card>

      <nav className="grid grid-cols-5 items-center gap-1 rounded-full border border-border/60 bg-card/70 p-1 shadow-sm">
        <Button
          asChild
          size="icon"
          variant={isWelcome ? 'secondary' : 'ghost'}
          className="h-10 w-full"
          aria-label={t('nav.welcome')}
        >
          <NavLink to="/" end>
            <SparklesIcon className="size-5" />
          </NavLink>
        </Button>
        <Button
          asChild
          size="icon"
          variant={isHome ? 'secondary' : 'ghost'}
          className="h-10 w-full"
          aria-label={t('nav.home')}
        >
          <NavLink to="/home">
            <HomeIcon className="size-5" />
          </NavLink>
        </Button>
        <Button
          asChild
          size="icon"
          variant={isHistory ? 'secondary' : 'ghost'}
          className="h-10 w-full"
          aria-label={t('home.actions.history')}
        >
          <NavLink to="/history">
            <HistoryIcon className="size-5" />
          </NavLink>
        </Button>
        <Button
          asChild
          size="icon"
          variant={isAccounts ? 'secondary' : 'ghost'}
          className="h-10 w-full"
          aria-label={t('nav.accounts')}
        >
          <NavLink to="/accounts">
            <UsersIcon className="size-5" />
          </NavLink>
        </Button>
        <Button
          asChild
          size="icon"
          variant={isSettings ? 'secondary' : 'ghost'}
          className="h-10 w-full"
          aria-label={t('nav.settings')}
        >
          <NavLink to="/settings">
            <SettingsIcon className="size-5" />
          </NavLink>
        </Button>
      </nav>
    </div>
  )
}

export default AppShell
