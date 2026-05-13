import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, CopyIcon, Loader2Icon, SignatureIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'
import { useCurrentIdentity } from '@/hooks/use-current-identity'
import { useAccountNames } from '@/hooks/use-account-names'
import { isWatchOnlyIdentity } from '@/lib/accounts'
import { signMessage } from '@/lib/message-signing/sign'
import PassphraseAuth from '@/pages/passphrase-auth'

type Step = 'form' | 'auth'

const SignMessage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { copyText } = useClipboardCopy()
  const currentIdentity = useCurrentIdentity()
  const accountNames = useAccountNames()
  const accountName = accountNames.find((entry) => entry.identity === currentIdentity)?.name ?? ''
  const isWatchOnly = isWatchOnlyIdentity(currentIdentity)

  const [message, setMessage] = useState('')
  const [output, setOutput] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [signing, setSigning] = useState(false)

  const canSign = message.trim().length > 0 && !signing && !isWatchOnly && Boolean(currentIdentity)

  const handleMessageChange = (value: string) => {
    setMessage(value)
    if (output) setOutput('')
  }

  const handleSignClick = () => {
    if (!canSign) return
    setOutput('')
    setStep('auth')
  }

  const handleAuthSuccess = async (seed: string) => {
    setStep('form')
    setSigning(true)
    try {
      const json = await signMessage({ seed, message, identity: currentIdentity })
      setOutput(json)
    } catch {
      toast.error(t('signMessage.errors.signFailed'))
    } finally {
      setSigning(false)
    }
  }

  const handleAuthCancel = () => {
    setStep('form')
  }

  const handleCopy = () => {
    copyText(output, {
      messages: {
        successTitle: t('signMessage.copied'),
        errorTitle: t('signMessage.errors.copyFailed'),
      },
    })
  }

  return (
    <>
      <section className="flex w-full justify-center pt-4">
        <div className="flex w-full max-w-sm flex-col gap-6 px-4">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t('signMessage.back')}
          </button>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SignatureIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">{t('signMessage.title')}</h2>
            </div>
            {accountName && (
              <p className="text-xs text-muted-foreground">
                {t('signMessage.fromAccount', { name: accountName })}
              </p>
            )}
          </div>

          {isWatchOnly && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{t('signMessage.watchOnly')}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sign-message" className="text-sm text-muted-foreground">
              {t('signMessage.messageLabel')}
            </Label>
            <Textarea
              id="sign-message"
              value={message}
              onChange={(event) => handleMessageChange(event.target.value)}
              rows={4}
              placeholder={t('signMessage.messagePlaceholder')}
              className="resize-none"
              disabled={isWatchOnly || signing}
              autoFocus
            />
          </div>

          <Button onClick={handleSignClick} disabled={!canSign} className="gap-2">
            {signing ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {t('signMessage.actions.signing')}
              </>
            ) : (
              <>
                <SignatureIcon className="h-4 w-4" />
                {t('signMessage.actions.sign')}
              </>
            )}
          </Button>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  {t('signMessage.outputLabel')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 gap-1.5 px-2 text-xs"
                >
                  <CopyIcon className="h-3.5 w-3.5" />
                  {t('signMessage.actions.copy')}
                </Button>
              </div>
              <Textarea
                value={output}
                readOnly
                rows={10}
                className="resize-none font-mono text-xs"
              />
            </div>
          )}
        </div>
      </section>

      {step === 'auth' && (
        <PassphraseAuth
          open
          identity={currentIdentity}
          title={t('signMessage.authTitle')}
          subtitle={t('signMessage.authSubtitle')}
          onSuccess={handleAuthSuccess}
          onCancel={handleAuthCancel}
        />
      )}
    </>
  )
}

export default SignMessage
