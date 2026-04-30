import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, Link2OffIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { getChromeApi } from '@/lib/dapp/chrome-api'
import {
  type DappPermissionRecord,
  DAPP_PERMISSIONS_KEY,
  getDappPermissions,
  removeDappPermission,
} from '@/lib/dapp/storage'
import { useAccountNames } from '@/hooks/use-account-names'
import { truncateString } from '@/lib/utils'

const ConnectedSites = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sites, setSites] = useState<DappPermissionRecord[]>([])
  const allAccounts = useAccountNames()
  const accountNames = useMemo(() => {
    const next: Record<string, string> = {}
    for (const entry of allAccounts) {
      next[entry.identity] = entry.name
    }
    return next
  }, [allAccounts])

  const [disconnectingOrigin, setDisconnectingOrigin] = useState('')

  const loadSites = useCallback(async () => {
    const permissions = await getDappPermissions()
    const entries = Object.values(permissions).sort((a, b) => b.connectedAt - a.connectedAt)
    setSites(entries)
  }, [])

  useEffect(() => {
    void loadSites()
    const chromeApi = getChromeApi()
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

  const empty = sites.length === 0

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
              <div key={site.origin} className="rounded-lg border border-border/60 px-3 py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{site.origin}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
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
                {(site.approvedIdentities?.length ?? 0) === 0 ? (
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    {t('settings.connectedSites.authorizedAccounts')}:{' '}
                    {t('settings.connectedSites.noAuthorizedAccounts')}
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="mt-1">
                    <AccordionItem value="authorized-accounts" className="border-b-0">
                      <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
                        {t('settings.connectedSites.authorizedAccountsCount', {
                          count: site.approvedIdentities?.length ?? 0,
                        })}
                      </AccordionTrigger>
                      <AccordionContent className="pb-1">
                        <div className="space-y-1">
                          {site.approvedIdentities?.map((id) => (
                            <p key={id} className="truncate text-xs text-muted-foreground">
                              <span className="text-foreground">
                                {accountNames[id] ?? t('settings.connectedSites.accountFallback')}
                              </span>{' '}
                              <span className="font-mono">({truncateString(id)})</span>
                            </p>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ConnectedSites
