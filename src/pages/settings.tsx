import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { useNavigate } from 'react-router-dom'
import { VaultInvalidPassphraseError } from '@qubic-labs/sdk'
import { CheckIcon, DownloadIcon } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { setLanguage } from '@/i18n'
import { getLockTimeoutMinutes, lockWallet, setLockTimeoutMinutes } from '@/lib/lock'
import { openBrowserVault } from '@/lib/vault'
import { exportVaultToWebWalletFormat } from '@/lib/vault-export'

const Settings = () => {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [lockMinutes, setLockMinutes] = useState(() => getLockTimeoutMinutes())
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false)
  const [exportPassphrase, setExportPassphrase] = useState('')
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)

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

  const handleExportVault = async () => {
    if (!exportPassphrase.trim()) {
      setExportError(t('settings.exportVault.errors.passphraseRequired'))
      return
    }

    setExporting(true)
    setExportError('')

    try {
      // Open SDK vault
      const vault = await openBrowserVault(exportPassphrase.trim(), false)

      // Export to web wallet format using WalletService
      const encryptedVault = await exportVaultToWebWalletFormat(vault, exportPassphrase.trim())

      // Convert to JSON and download
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

  return (
    <>
      <section className="flex w-full justify-center pt-4">
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

          <Button variant="outline" onClick={() => setExportDrawerOpen(true)}>
            <DownloadIcon className="h-4 w-4" />
            {t('settings.exportVault.button')}
          </Button>
        </div>
      </section>

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
    </>
  )
}

export default Settings
