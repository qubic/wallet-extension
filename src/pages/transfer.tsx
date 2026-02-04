import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeftIcon, CheckCircleIcon, SendIcon } from 'lucide-react'
import { useBalance, useSend } from '@qubic-labs/react'
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
import { isValidIdentity, normalizeBalance, parseAmount, formatBalance } from '@/lib/utils'
import PassphraseAuth from '@/pages/passphrase-auth'

type Step = 'form' | 'auth' | 'success'

type FormErrors = {
  recipient?: string
  amount?: string
}

type TxResult = {
  txId: string
  targetTick: string
  amount: bigint
}

const TransferSuccess = ({
  txResult,
  onSendAnother,
  onViewHistory,
}: {
  txResult: TxResult
  onSendAnother: () => void
  onViewHistory: () => void
}) => {
  const { t } = useTranslation()

  return (
    <section className="flex min-h-full w-full justify-center pb-6 pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-6">
        <button
          type="button"
          onClick={onSendAnother}
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
                {t('transfer.success.amount')}
              </div>
              <div className="mt-1 text-sm font-semibold">{formatBalance(txResult.amount)} QU</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onViewHistory} variant="outline" size="lg" className="flex-1">
            {t('transfer.success.viewHistory')}
          </Button>
          <Button onClick={onSendAnother} size="lg" className="flex-1">
            {t('transfer.success.sendAnother')}
          </Button>
        </div>
      </div>
    </section>
  )
}

const ConfirmationDrawer = ({
  open,
  onOpenChange,
  recipient,
  amount,
  sending,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: string
  amount: string
  sending: boolean
  onCancel: () => void
  onConfirm: () => void
}) => {
  const { t } = useTranslation()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
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
              onClick={onCancel}
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={sending}
            >
              {t('transfer.actions.cancel')}
            </Button>
            <Button onClick={onConfirm} size="lg" className="flex-1" disabled={sending}>
              {sending ? t('transfer.actions.sending') : t('transfer.actions.confirm')}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

const BalanceDisplay = ({ balance }: { balance: ReturnType<typeof useBalance> }) => {
  const { t } = useTranslation()
  const currentBalance = normalizeBalance(balance.data?.balance)

  return (
    <div className="rounded-lg bg-muted/20 p-4">
      <div className="text-xs font-semibold uppercase text-muted-foreground">
        {t('transfer.balance.label')}
      </div>
      <div className="mt-2 text-2xl font-semibold">
        {balance.isLoading ? (
          <span className="text-sm text-muted-foreground">{t('transfer.balance.loading')}</span>
        ) : balance.error ? (
          <span className="text-sm text-destructive">{balance.error.message}</span>
        ) : (
          <span>{formatBalance(currentBalance)} QU</span>
        )}
      </div>
    </div>
  )
}

const TransferForm = ({
  recipient,
  amount,
  errors,
  errorMessage,
  balance,
  onRecipientChange,
  onAmountChange,
  onContinue,
}: {
  recipient: string
  amount: string
  errors: FormErrors
  errorMessage: string
  balance: ReturnType<typeof useBalance>
  onRecipientChange: (value: string) => void
  onAmountChange: (value: string) => void
  onContinue: () => void
}) => {
  const { t } = useTranslation()

  return (
    <section className="flex min-h-full w-full justify-center pb-6 pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-6">
        <div>
          <h1 className="text-2xl font-semibold">{t('transfer.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('transfer.subtitle')}</p>
        </div>

        <BalanceDisplay balance={balance} />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">{t('transfer.form.recipient')}</Label>
            <Input
              id="recipient"
              placeholder={t('transfer.form.recipientPlaceholder')}
              value={recipient}
              onChange={(e) => onRecipientChange(e.target.value.toUpperCase())}
              className={errors.recipient ? 'border-destructive' : ''}
            />
            {errors.recipient && (
              <p className="mt-1 text-xs text-destructive">{errors.recipient}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t('transfer.form.amount')}</Label>
            <Input
              id="amount"
              type="text"
              placeholder={t('transfer.form.amountPlaceholder')}
              value={amount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d,]/g, '')
                onAmountChange(value)
              }}
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount}</p>}
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        <Button onClick={onContinue} size="lg" className="w-full">
          <SendIcon className="mr-2 h-4 w-4" />
          {t('transfer.actions.continue')}
        </Button>
      </div>
    </section>
  )
}

const Transfer = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const currentIdentity = localStorage.getItem('currentIdentity') ?? ''

  const balance = useBalance(currentIdentity)
  const sendMutation = useSend()

  const [step, setStep] = useState<Step>('form')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [txResult, setTxResult] = useState<TxResult | null>(null)

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
      } else if (balance.isLoading) {
        newErrors.amount = t('transfer.validation.balanceLoading')
      } else {
        const currentBalance = normalizeBalance(balance.data?.balance)
        if (parsedAmount > currentBalance) {
          newErrors.amount = t('transfer.validation.amountExceedsBalance')
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validateForm()) {
      setStep('auth')
      setErrorMessage('')
    }
  }

  const handleAuthSuccess = async (seed: string) => {
    setSending(true)
    setErrorMessage('')
    setDrawerOpen(true)

    try {
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
        amount: parsedAmount,
      })

      setDrawerOpen(false)
      setStep('success')

      toast.success(t('transfer.success.title'), {
        description: t('transfer.success.description'),
      })

      balance.refetch()
    } catch (error) {
      let message = t('transfer.errors.generic')

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          message = t('transfer.errors.networkError')
        } else if (error.message.includes('broadcast')) {
          message = t('transfer.errors.broadcastFailed')
        } else {
          message = error.message
        }
      }

      setErrorMessage(message)
      setStep('form')
      toast.error(t('transfer.errors.generic'), {
        description: message,
      })
    } finally {
      setSending(false)
      setDrawerOpen(false)
    }
  }

  const handleAuthCancel = () => {
    setStep('form')
  }

  const handleSendAnother = () => {
    setStep('form')
    setRecipient('')
    setAmount('')
    setErrors({})
    setErrorMessage('')
    setTxResult(null)
  }

  const handleViewHistory = () => {
    navigate('/history')
  }

  const handleRecipientChange = (value: string) => {
    setRecipient(value)
    if (errors.recipient) {
      setErrors({ ...errors, recipient: undefined })
    }
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    if (errors.amount) {
      setErrors({ ...errors, amount: undefined })
    }
  }

  if (step === 'auth') {
    return (
      <PassphraseAuth
        onSuccess={handleAuthSuccess}
        onCancel={handleAuthCancel}
      />
    )
  }

  if (step === 'success' && txResult) {
    return (
      <TransferSuccess
        txResult={txResult}
        onSendAnother={handleSendAnother}
        onViewHistory={handleViewHistory}
      />
    )
  }

  return (
    <>
      <TransferForm
        recipient={recipient}
        amount={amount}
        errors={errors}
        errorMessage={errorMessage}
        balance={balance}
        onRecipientChange={handleRecipientChange}
        onAmountChange={handleAmountChange}
        onContinue={handleContinue}
      />

      <ConfirmationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        recipient={recipient}
        amount={amount}
        sending={sending}
        onCancel={() => setDrawerOpen(false)}
        onConfirm={() => {}}
      />
    </>
  )
}

export default Transfer
