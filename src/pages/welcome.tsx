import { KeyRoundIcon, PanelRightOpenIcon, PlusCircleIcon, UploadIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const Welcome = () => {
  const navigate = useNavigate()

  const openSidePanel = async () => {
    const chromeApi = (
      globalThis as typeof globalThis & {
        chrome?: {
          sidePanel?: { open?: (options: { windowId?: number }) => Promise<void> }
          windows?: { getCurrent?: () => Promise<{ id?: number }>; WINDOW_ID_CURRENT?: number }
        }
      }
    ).chrome

    if (!chromeApi?.sidePanel?.open) {
      return
    }

    let windowId: number | undefined

    if (chromeApi.windows?.getCurrent) {
      try {
        const currentWindow = await chromeApi.windows.getCurrent()
        windowId = currentWindow.id
      } catch {
        windowId = undefined
      }
    }

    if (windowId == null) {
      windowId = chromeApi.windows?.WINDOW_ID_CURRENT
    }

    if (windowId == null) {
      return
    }

    await chromeApi.sidePanel.open({ windowId })
  }

  return (
    <section className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <img src="/branding/Qubic-Logo-White.svg" alt="Qubic" className="h-9" />
        <p className="text-sm text-muted-foreground">Welcome to Qubic Wallet</p>
      </div>

      <div className="grid w-full max-w-xs gap-3">
        <Button size="lg" className="w-full" onClick={() => navigate('/onboarding/create')}>
          <PlusCircleIcon className="h-5 w-5" />
          Create a new wallet
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => navigate('/onboarding/import-seed')}
        >
          <KeyRoundIcon className="h-5 w-5" />
          Restore with seed phrase
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => navigate('/onboarding/import-vault')}
        >
          <UploadIcon className="h-5 w-5" />
          Import vault backup
        </Button>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="absolute right-4 top-4 h-10 w-10"
        aria-label="Open side panel"
        onClick={openSidePanel}
      >
        <PanelRightOpenIcon className="h-5 w-5" />
      </Button>
    </section>
  )
}

export default Welcome
