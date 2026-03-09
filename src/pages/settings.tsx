import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { VaultInvalidPassphraseError } from '@qubic-labs/sdk'
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronRightIcon,
  DownloadIcon,
  ExternalLinkIcon,
  InfoIcon,
  LifeBuoyIcon,
  Link2Icon,
  LockIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { lockWallet } from '@/lib/lock'
import { openBrowserVault } from '@/lib/vault'
import { exportVaultToWebWalletFormat } from '@/lib/vault-export'

declare const __APP_VERSION__: string

const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

const Settings = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [exportDrawerOpen, setExportDrawerOpen] = useState(false)
  const [exportPassphrase, setExportPassphrase] = useState('')
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)

  const [supportDrawerOpen, setSupportDrawerOpen] = useState(false)
  const [aboutDrawerOpen, setAboutDrawerOpen] = useState(false)

  const handleLockNow = () => {
    lockWallet()
    navigate('/unlock')
  }

  const handleExportVault = async () => {
    if (!exportPassphrase.trim()) {
      setExportError(t('settings.exportVault.errors.passphraseRequired'))
      return
    }

    setExporting(true)
    setExportError('')

    try {
      const vault = await openBrowserVault(exportPassphrase.trim(), false)
      const encryptedVault = await exportVaultToWebWalletFormat(vault, exportPassphrase.trim())

      const json = JSON.stringify(encryptedVault, null, 2)
      const blob = new Blob([new TextEncoder().encode(json)], {
        type: 'application/octet-stream',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'wallet.qubic-vault'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportDrawerOpen(false)
      setExportPassphrase('')
      setExportError('')
    } catch (error) {
      if (error instanceof VaultInvalidPassphraseError) {
        setExportError(t('settings.exportVault.errors.invalidPassphrase'))
      } else {
        setExportError(t('settings.exportVault.errors.exportFailed'))
      }
    } finally {
      setExporting(false)
    }
  }

  const categories = [
    {
      key: 'accounts',
      icon: UsersIcon,
      label: t('settings.categories.accounts'),
      description: t('settings.categories.accountsDesc'),
      action: () => navigate('/accounts'),
    },
    {
      key: 'connectedSites',
      icon: Link2Icon,
      label: t('settings.categories.connectedSites'),
      description: t('settings.categories.connectedSitesDesc'),
      action: () => navigate('/settings/connected-sites'),
    },
    {
      key: 'general',
      icon: SlidersHorizontalIcon,
      label: t('settings.categories.general'),
      description: t('settings.categories.generalDesc'),
      action: () => navigate('/settings/general'),
    },
    {
      key: 'security',
      icon: ShieldIcon,
      label: t('settings.categories.security'),
      description: t('settings.categories.securityDesc'),
      action: () => navigate('/settings/security'),
    },
    {
      key: 'backup',
      icon: DownloadIcon,
      label: t('settings.categories.backup'),
      description: t('settings.categories.backupDesc'),
      action: () => setExportDrawerOpen(true),
    },
    {
      key: 'support',
      icon: LifeBuoyIcon,
      label: t('settings.categories.support'),
      description: t('settings.categories.supportDesc'),
      action: () => setSupportDrawerOpen(true),
    },
    {
      key: 'about',
      icon: InfoIcon,
      label: t('settings.categories.about'),
      description: t('settings.categories.aboutDesc'),
      action: () => setAboutDrawerOpen(true),
    },
  ]

  return (
    <>
      <section className="flex w-full justify-center pt-4">
        <div className="flex w-full max-w-sm flex-col gap-6 px-4">
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={cat.action}
                className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card/80 px-3 py-3 text-left transition hover:bg-muted/20"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/30">
                  <cat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                  <span className="block text-xs text-muted-foreground">{cat.description}</span>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>

          <Button
            size="sm"
            className="h-12 w-full gap-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
            onClick={handleLockNow}
          >
            <LockIcon className="h-4 w-4" />
            {t('settings.lockNow')}
          </Button>

          <p className="pb-4 text-center text-xs text-muted-foreground">
            {t('settings.about.versionLabel', { version: appVersion })}
          </p>
        </div>
      </section>

      {/* Export Vault Drawer */}
      <Drawer
        open={exportDrawerOpen}
        onOpenChange={(open) => {
          setExportDrawerOpen(open)
          if (!open) {
            setExportPassphrase('')
            setExportError('')
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('settings.exportVault.drawerTitle')}</DrawerTitle>
            <DrawerDescription>{t('settings.exportVault.drawerDescription')}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4">
            <Label htmlFor="export-passphrase">{t('settings.exportVault.passphrase')}</Label>
            <Input
              id="export-passphrase"
              type="password"
              value={exportPassphrase}
              onChange={(event) => {
                setExportPassphrase(event.target.value)
                if (exportError) setExportError('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !exporting) {
                  handleExportVault()
                }
              }}
            />
            {exportError && <p className="text-xs text-destructive">{exportError}</p>}
          </div>
          <DrawerFooter>
            <Button onClick={handleExportVault} disabled={exporting || !exportPassphrase.trim()}>
              <CheckIcon className="h-4 w-4" />
              {exporting ? t('settings.exportVault.exporting') : t('settings.exportVault.confirm')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Support Drawer */}
      <Drawer open={supportDrawerOpen} onOpenChange={setSupportDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('settings.support.title')}</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-4">
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 shrink-0 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-500">
                  {t('settings.support.warningTitle')}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('settings.support.warningDescription')}
              </p>
            </div>

            <a
              href="https://discord.com/channels/768887649540243497/1029858434117550170"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-3 transition hover:bg-muted/20"
            >
              <span className="text-sm flex-1">{t('settings.support.discord')}</span>
              <ExternalLinkIcon className="h-4 w-4 text-muted-foreground" />
            </a>

            <a
              href="https://github.com/qubic/wallet-extension/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-3 transition hover:bg-muted/20"
            >
              <span className="text-sm flex-1">{t('settings.support.github')}</span>
              <ExternalLinkIcon className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </DrawerContent>
      </Drawer>

      {/* About Drawer */}
      <Drawer open={aboutDrawerOpen} onOpenChange={setAboutDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('settings.about.title')}</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-3 px-4 pb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('settings.about.extensionName')}</span>
              <span className="font-medium">Qubic Wallet</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('settings.about.appVersion')}</span>
              <span className="font-medium">
                {t('settings.about.versionLabel', { version: appVersion })}
              </span>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Settings
