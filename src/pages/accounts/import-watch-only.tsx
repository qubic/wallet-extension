import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isValidIdentity } from '@/lib/utils'
import {
  getWatchOnlyAccounts,
  isAccountNameTaken,
  saveWatchOnlyAccounts,
  type WatchOnlyAccount,
} from '@/lib/accounts'

const ImportWatchOnly = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [identity, setIdentity] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleSubmit = () => {
    setStatus(null)
    const trimmedName = name.trim()
    const trimmedIdentity = identity.trim()
    if (!trimmedName || !trimmedIdentity) {
      setStatus(t('accounts.manage.errors.watchOnlyRequired'))
      return
    }
    if (isAccountNameTaken(trimmedName)) {
      setStatus(t('accounts.manage.errors.nameDuplicate'))
      return
    }
    if (!isValidIdentity(trimmedIdentity)) {
      setStatus(t('accounts.manage.errors.watchOnlyInvalid'))
      return
    }
    const existing = getWatchOnlyAccounts()
    if (existing.some((entry) => entry.identity === trimmedIdentity)) {
      setStatus(t('accounts.manage.errors.watchOnlyDuplicate'))
      return
    }
    const next: WatchOnlyAccount[] = [
      ...existing,
      { name: trimmedName, identity: trimmedIdentity, watchOnly: true },
    ]
    saveWatchOnlyAccounts(next)
    navigate('/accounts')
  }

  return (
    <section className="flex min-h-full w-full justify-center pb-6 pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-4">
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-semibold">{t('accounts.watchOnly.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('accounts.watchOnly.subtitle')}</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="watch-only-name">{t('accounts.manage.watchOnlyName')}</Label>
            <Input
              id="watch-only-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="watch-only-identity">{t('accounts.manage.watchOnlyIdentity')}</Label>
            <Input
              id="watch-only-identity"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
            />
          </div>
          {status && <p className="text-xs text-destructive">{status}</p>}
        </div>
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/accounts')}>
            {t('accounts.manage.cancel')}
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            {t('accounts.watchOnly.submit')}
          </Button>
        </div>
      </div>
    </section>
  )
}

export default ImportWatchOnly
