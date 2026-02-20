import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, Link2OffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DAPP_PERMISSIONS_KEY, getDappPermissions, removeDappPermission } from '@/lib/dapp/storage'

type ConnectedSite = {
  origin: string
  connectedAt: number
}

const ConnectedSites = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sites, setSites] = useState<ConnectedSite[]>([])
  const [disconnectingOrigin, setDisconnectingOrigin] = useState('')

  const loadSites = useCallback(async () => {
    const permissions = await getDappPermissions()
    const entries = Object.values(permissions)
      .map((entry) => ({ origin: entry.origin, connectedAt: entry.connectedAt }))
      .sort((a, b) => b.connectedAt - a.connectedAt)
    setSites(entries)
  }, [])

  useEffect(() => {
    void loadSites()
    const chromeApi = (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return
      if (!changes[DAPP_PERMISSIONS_KEY]) return
      void loadSites()
    }
    chromeApi?.storage?.onChanged?.addListener(onChanged)
    return () => chromeApi?.storage?.onChanged?.removeListener(onChanged)
  }, [loadSites])

  const handleDisconnect = async (origin: string) => {
    setDisconnectingOrigin(origin)
    try {
      await removeDappPermission(origin)
      await loadSites()
    } finally {
      setDisconnectingOrigin('')
    }
  }

  const empty = useMemo(() => sites.length === 0, [sites.length])

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-4">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('settings.connectedSites.back')}
        </button>

        <h2 className="text-base font-semibold">{t('settings.connectedSites.title')}</h2>

        {empty ? (
          <p className="text-sm text-muted-foreground">{t('settings.connectedSites.empty')}</p>
        ) : (
          <div className="space-y-2">
            {sites.map((site) => (
              <div
                key={site.origin}
                className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{site.origin}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.connectedSites.connectedAt', {
                      date: new Date(site.connectedAt).toLocaleString(),
                    })}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => void handleDisconnect(site.origin)}
                  disabled={disconnectingOrigin === site.origin}
                >
                  <Link2OffIcon className="h-3.5 w-3.5" />
                  {t('settings.connectedSites.disconnect')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ConnectedSites
