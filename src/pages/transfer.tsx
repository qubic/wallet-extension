import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeftIcon, CheckCircleIcon, SendIcon } from 'lucide-react'
import { useBalance, useSend } from '@qubic-labs/react'
import { VaultInvalidPassphraseError, VaultEntryNotFoundError } from '@qubic-labs/sdk'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { openBrowserVault } from '@/lib/vault'
import { isValidIdentity, normalizeBalance, parseAmount, formatBalance } from '@/lib/utils'

type Step = 'form' | 'success'

type FormErrors = {
  recipient?: string
  amount?: string
  passphrase?: string
}

const Transfer = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const currentIdentity = localStorage.getItem('currentIdentity') ?? ''
  const currentAccountName = localStorage.getItem('currentAccountName') ?? 'Main account'

  const balance = useBalance(currentIdentity)
  const sendMutation = useSend()

  const [step, setStep] = useState<Step>('form')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [txResult, setTxResult] = useState<{
    txId: string
    targetTick: string
    peers: number
  } | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!recipient.trim()) {
      newErrors.recipient = t('transfer.validation.recipientRequired')
    } else if (!isValidIdentity(recipient.trim())) {
      newErrors.recipient = t('transfer.validation.recipientInvalid')
    } else if (recipient.trim() === currentIdentity) {
      newErrors.recipient = t('transfer.validation.recipientSameAsSender')
    }

    if (!amount.trim()) {
      newErrors.amount = t('transfer.validation.amountRequired')
    } else {
      const parsedAmount = parseAmount(amount)
      if (!parsedAmount || parsedAmount <= 0n) {
        newErrors.amount = t('transfer.validation.amountInvalid')
      } else {
        const currentBalance = normalizeBalance(balance.data?.balance)
        if (parsedAmount > currentBalance) {
          newErrors.amount = t('transfer.validation.amountExceedsBalance')
        }
      }
    }

    if (!passphrase.trim()) {
      newErrors.passphrase = t('transfer.validation.passphraseRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validateForm()) {
      setDrawerOpen(true)
      setErrorMessage('')
    }
  }

  const handleConfirmSend = async () => {
    if (!validateForm()) {
      setDrawerOpen(false)
      return
    }

    setSending(true)
    setErrorMessage('')

    try {
      const vault = await openBrowserVault(passphrase, false)
      const seed = await vault.getSeed(currentAccountName)
      setPassphrase('') 

      const parsedAmount = parseAmount(amount)
      if (!parsedAmount) {
        throw new Error(t('transfer.validation.amountInvalid'))
      }

      const result = await sendMutation.mutateAsync({
        toIdentity: recipient.trim(),
        amount: parsedAmount,
        fromSeed: seed,
      })

      setTxResult({
        txId: result.txId,
        targetTick: result.targetTick.toString(),
        peers: result.broadcast.peersBroadcasted,
      })

      setDrawerOpen(false)
      setStep('success')

      toast.success(t('transfer.success.title'), {
        description: t('transfer.success.description'),
      })

      balance.refetch()
    } catch (error) {
      let message = t('transfer.errors.generic')

      if (error instanceof VaultInvalidPassphraseError) {
        message = t('transfer.errors.invalidPassphrase')
      } else if (error instanceof VaultEntryNotFoundError) {
        message = t('transfer.errors.accountNotFound')
      } else if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          message = t('transfer.errors.networkError')
        } else if (error.message.includes('broadcast')) {
          message = t('transfer.errors.broadcastFailed')
        } else {
          message = error.message
        }
      }

      setErrorMessage(message)
      toast.error(t('transfer.errors.generic'), {
        description: message,
      })
    } finally {
      setSending(false)
      setPassphrase('') 
    }
  }

  const handleSendAnother = () => {
    setStep('form')
    setRecipient('')
    setAmount('')
    setPassphrase('')
    setErrors({})
    setErrorMessage('')
    setTxResult(null)
  }

  const handleViewHistory = () => {
    navigate('/history')
  }

  const currentBalance = normalizeBalance(balance.data?.balance)

  if (step === 'success' && txResult) {
    return (
      <section className="flex min-h-full w-full justify-center pb-6 pt-4">
        <div className="flex w-full max-w-sm flex-col gap-6 px-6">
          <button
            type="button"
            onClick={handleSendAnother}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t('transfer.actions.back')}
          </button>

          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold">{t('transfer.success.title')}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('transfer.success.description')}
              </p>
            </div>

            <div className="w-full space-y-3 rounded-lg bg-muted/20 p-4 text-left">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {t('transfer.success.txId')}
                </div>
                <div className="mt-1 break-all font-mono text-xs">{txResult.txId}</div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {t('transfer.success.targetTick')}
                </div>
                <div className="mt-1 font-mono text-sm">{txResult.targetTick}</div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {t('transfer.success.peers', { count: txResult.peers })}
                </div>
                <div className="mt-1 text-sm">{txResult.peers}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleViewHistory} variant="outline" size="lg" className="flex-1">
              {t('transfer.success.viewHistory')}
            </Button>
            <Button onClick={handleSendAnother} size="lg" className="flex-1">
              {t('transfer.success.sendAnother')}
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="flex min-h-full w-full justify-center pb-6 pt-4">
        <div className="flex w-full max-w-sm flex-col gap-6 px-6">
          <div>
            <h1 className="text-2xl font-semibold">{t('transfer.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('transfer.subtitle')}</p>
          </div>

          <div className="rounded-lg bg-muted/20 p-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              {t('transfer.balance.label')}
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {balance.isLoading ? (
                <span className="text-sm text-muted-foreground">
                  {t('transfer.balance.loading')}
                </span>
              ) : balance.error ? (
                <span className="text-sm text-destructive">{balance.error.message}</span>
              ) : (
                <span>{formatBalance(currentBalance)} QU</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">{t('transfer.form.recipient')}</Label>
              <Input
                id="recipient"
                placeholder={t('transfer.form.recipientPlaceholder')}
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value.toUpperCase())
                  if (errors.recipient) {
                    setErrors({ ...errors, recipient: undefined })
                  }
                }}
                className={errors.recipient ? 'border-destructive' : ''}
              />
              {errors.recipient && (
                <p className="mt-1 text-xs text-destructive">{errors.recipient}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor="amount">{t('transfer.form.amount')}</Label>
              <Input
                id="amount"
                type="text"
                placeholder={t('transfer.form.amountPlaceholder')}
                value={amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d,]/g, '')
                  setAmount(value)
                  if (errors.amount) {
                    setErrors({ ...errors, amount: undefined })
                  }
                }}
                className={errors.amount ? 'border-destructive' : ''}
              />
              {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="passphrase">{t('transfer.form.passphrase')}</Label>
              <Input
                id="passphrase"
                type="password"
                placeholder={t('transfer.form.passphrasePlaceholder')}
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value)
                  if (errors.passphrase) {
                    setErrors({ ...errors, passphrase: undefined })
                  }
                }}
                className={errors.passphrase ? 'border-destructive' : ''}
              />
              {errors.passphrase && (
                <p className="mt-1 text-xs text-destructive">{errors.passphrase}</p>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          <Button onClick={handleContinue} size="lg" className="w-full">
            <SendIcon className="mr-2 h-4 w-4" />
            {t('transfer.actions.continue')}
          </Button>
        </div>
      </section>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('transfer.confirm.title')}</DrawerTitle>
            <DrawerDescription>{t('transfer.confirm.description')}</DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 p-4">
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                {t('transfer.confirm.to')}
              </div>
              <div className="mt-1 break-all font-mono text-sm">{recipient}</div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                {t('transfer.confirm.amount')}
              </div>
              <div className="mt-1 text-xl font-semibold">
                {formatBalance(parseAmount(amount) || 0n)} QU
              </div>
            </div>

            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {t('transfer.confirm.warning')}
              </p>
            </div>
          </div>

          <DrawerFooter>
            <div className="flex gap-3">
              <Button
                onClick={() => setDrawerOpen(false)}
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={sending}
              >
                {t('transfer.actions.cancel')}
              </Button>
              <Button onClick={handleConfirmSend} size="lg" className="flex-1" disabled={sending}>
                {sending ? t('transfer.actions.sending') : t('transfer.actions.confirm')}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Transfer
