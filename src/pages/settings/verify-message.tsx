import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  FileCheck2Icon,
  Loader2Icon,
  ShieldCheckIcon,
  ShieldXIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { VerifyMessageErrorCode } from '@/lib/message-signing/verify'
import { verifyMessage } from '@/lib/message-signing/verify'

type Status =
  | { kind: 'idle' }
  | { kind: 'valid'; identity: string; message: string }
  | { kind: 'invalid' }
  | { kind: 'error'; code: VerifyMessageErrorCode }

const VerifyMessage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [verifying, setVerifying] = useState(false)

  const hasInput = input.trim().length > 0

  const handleInputChange = (value: string) => {
    setInput(value)
    if (status.kind !== 'idle') setStatus({ kind: 'idle' })
  }

  const handleClear = () => {
    setInput('')
    setStatus({ kind: 'idle' })
  }

  const handleVerify = async () => {
    if (!hasInput) return
    setVerifying(true)
    try {
      const result = await verifyMessage(input)
      if (result.ok) {
        setStatus({ kind: 'valid', identity: result.identity, message: result.message })
      } else if (result.error === 'invalid') {
        setStatus({ kind: 'invalid' })
      } else {
        setStatus({ kind: 'error', code: result.error })
      }
    } catch {
      setStatus({ kind: 'error', code: 'invalid' })
    } finally {
      setVerifying(false)
    }
  }

  const errorMessage = (code: VerifyMessageErrorCode): string => t(`verifyMessage.errors.${code}`)

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-4">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('verifyMessage.back')}
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileCheck2Icon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">{t('verifyMessage.title')}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{t('verifyMessage.description')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verify-input" className="text-sm text-muted-foreground">
            {t('verifyMessage.inputLabel')}
          </Label>
          <Textarea
            id="verify-input"
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder={t('verifyMessage.inputPlaceholder')}
            rows={8}
            className="resize-none font-mono text-xs"
            disabled={verifying}
          />
          {hasInput && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 px-2 text-xs text-muted-foreground"
                disabled={verifying}
              >
                {t('verifyMessage.actions.clear')}
              </Button>
            </div>
          )}
        </div>

        {status.kind === 'valid' && (
          <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold text-green-500">
                {t('verifyMessage.result.valid')}
              </span>
            </div>
            <p className="mt-2 text-xs break-all text-muted-foreground">
              {t('verifyMessage.result.signedBy', { identity: status.identity })}
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t('verifyMessage.result.messageLabel')}
              </p>
              <pre className="max-h-40 overflow-auto rounded border border-border/60 bg-background/40 p-2 text-xs whitespace-pre-wrap break-all">
                {status.message}
              </pre>
            </div>
          </div>
        )}

        {status.kind === 'invalid' && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
            <div className="flex items-center gap-2">
              <ShieldXIcon className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                {t('verifyMessage.result.invalid')}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('verifyMessage.result.invalidDescription')}
            </p>
          </div>
        )}

        {status.kind === 'error' && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{errorMessage(status.code)}</p>
          </div>
        )}

        <Button onClick={handleVerify} disabled={!hasInput || verifying} className="gap-2">
          {verifying ? (
            <>
              <Loader2Icon className="h-4 w-4 animate-spin" />
              {t('verifyMessage.actions.verifying')}
            </>
          ) : (
            <>
              <ShieldCheckIcon className="h-4 w-4" />
              {t('verifyMessage.actions.verify')}
            </>
          )}
        </Button>
      </div>
    </section>
  )
}

export default VerifyMessage
