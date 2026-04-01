import { KeyRoundIcon, PanelRightOpenIcon, PlusCircleIcon, UploadIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getExtensionViewKind, toggleCurrentWindowSidePanel } from '@/lib/side-panel'

const Welcome = () => {
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  const { t } = useTranslation()
  const isSidePanelView = getExtensionViewKind() === 'sidepanel'

  return (
    <section className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <img
          src={
            resolvedTheme === 'light'
              ? '/branding/Qubic-Logo-Dark.svg'
              : '/branding/Qubic-Logo-White.svg'
          }
          alt="Qubic"
          className="h-9"
        />
        <p className="text-sm text-muted-foreground">{t('welcome.subtitle')}</p>
      </div>

      <div className="grid w-full max-w-xs gap-3">
        <Button size="lg" className="w-full" onClick={() => navigate('/onboarding/create')}>
          <PlusCircleIcon className="h-5 w-5" />
          {t('welcome.createWallet')}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => navigate('/onboarding/import-seed')}
        >
          <KeyRoundIcon className="h-5 w-5" />
          {t('welcome.restoreSeed')}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => navigate('/onboarding/import-vault')}
        >
          <UploadIcon className="h-5 w-5" />
          {t('welcome.importVault')}
        </Button>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="absolute right-4 top-4 h-10 w-10"
        aria-label={isSidePanelView ? t('app.closeSidepanel') : t('app.sidepanel')}
        onClick={toggleCurrentWindowSidePanel}
      >
        <PanelRightOpenIcon className="h-5 w-5" />
      </Button>
    </section>
  )
}

export default Welcome
