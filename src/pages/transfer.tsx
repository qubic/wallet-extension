import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeftIcon, CheckCircleIcon, SendIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBalance, useSdk, useSend } from '@qubic-labs/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
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
import { getWatchOnlyAccounts } from '@/lib/accounts'
import {
  type AggregatedAsset,
  aggregateAssets,
  formatAssetUnits,
  useOwnedAssets,
} from '@/lib/assets'
import {
  QX_ADDRESS,
  QX_TRANSFER_ASSET_FEE,
  QX_TRANSFER_ASSET_INPUT_TYPE,
  buildAssetTransferPayload,
} from '@/lib/qx'
import { useEffect } from 'react'

type Step = 'form' | 'auth' | 'success'

type FormErrors = {
  recipient?: string
  amount?: string
}

type TxResult = {
  txId: string
  targetTick: string
  amount: bigint
  tokenName: string
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
    <section className="flex w-full justify-center pt-4">
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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircleIcon className="h-8 w-8 text-success" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{t('transfer.success.title')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('transfer.success.description', { targetTick: txResult.targetTick })}
            </p>
          </div>

          <div className="w-full space-y-3 rounded-lg bg-card p-4 text-left">
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
              <div className="mt-1 text-sm font-semibold">
                {formatBalance(txResult.amount)} {txResult.tokenName}
              </div>
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
  tokenName,
  sending,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: string
  amount: string
  tokenName: string
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
              {formatBalance(parseAmount(amount) || 0n)} {tokenName}
            </div>
          </div>

          {tokenName !== 'QU' && (
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                {t('transfer.confirm.fee', { fee: '100' })}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
            <p className="text-sm text-warning-foreground">{t('transfer.confirm.warning')}</p>
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

const BalanceDisplay = ({
  balance,
  selectedAsset,
}: {
  balance: ReturnType<typeof useBalance>
  selectedAsset: AggregatedAsset | null
}) => {
  const { t } = useTranslation()

  if (selectedAsset) {
    return (
      <div className="rounded-lg bg-card p-4">
        <div className="text-xs font-semibold uppercase text-muted-foreground">
          {t('transfer.balance.label')}
        </div>
        <div className="mt-2 text-2xl font-semibold">
          {formatAssetUnits(selectedAsset.numberOfUnits, selectedAsset.decimals)}{' '}
          {selectedAsset.name}
        </div>
      </div>
    )
  }

  const currentBalance = normalizeBalance(balance.data?.balance)
  return (
    <div className="rounded-lg bg-card p-4">
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
  isWatchOnly,
  hasMultipleTokens,
  assets,
  selectedToken,
  selectedAsset,
  quBalance,
  onTokenChange,
  onRecipientChange,
  onAmountChange,
  onMaxAmount,
  onContinue,
}: {
  recipient: string
  amount: string
  errors: FormErrors
  errorMessage: string
  balance: ReturnType<typeof useBalance>
  isWatchOnly: boolean
  hasMultipleTokens: boolean
  assets: AggregatedAsset[]
  selectedToken: string
  selectedAsset: AggregatedAsset | null
  onTokenChange: (value: string) => void
  onRecipientChange: (value: string) => void
  onAmountChange: (value: string) => void
  quBalance: bigint
  onMaxAmount: () => void
  onContinue: () => void
}) => {
  const { t } = useTranslation()

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-6">
        <div>
          <h1 className="text-2xl font-semibold">{t('transfer.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('transfer.subtitle')}</p>
        </div>

        <BalanceDisplay balance={balance} selectedAsset={selectedAsset} />

        <div className="space-y-4">
          {hasMultipleTokens && (
            <div className="space-y-2">
              <Label>{t('transfer.form.token')}</Label>
              <Select value={selectedToken} onValueChange={onTokenChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qu">QU — {t('transfer.selectToken.native')}</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem
                      key={`${asset.issuerIdentity}-${asset.name}`}
                      value={`${asset.issuerIdentity}-${asset.name}`}
                    >
                      {asset.name} ({formatAssetUnits(asset.numberOfUnits, asset.decimals)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="recipient">{t('transfer.form.recipient')}</Label>
            <Input
              id="recipient"
              placeholder={t('transfer.form.recipientPlaceholder')}
              value={recipient}
              onChange={(e) => onRecipientChange(e.target.value.toUpperCase())}
              className={errors.recipient ? 'border-destructive' : ''}
              disabled={isWatchOnly}
            />
            {errors.recipient && (
              <p className="mt-1 text-xs text-destructive">{errors.recipient}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              {t('transfer.form.amount', { token: selectedAsset?.name ?? 'QU' })}
            </Label>
            <InputGroup className={errors.amount ? 'border-destructive' : ''}>
              <InputGroupInput
                id="amount"
                type="text"
                placeholder={t('transfer.form.amountPlaceholder')}
                value={amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d,]/g, '')
                  onAmountChange(value)
                }}
                disabled={isWatchOnly}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  variant="ghost"
                  size="xs"
                  onClick={onMaxAmount}
                  disabled={isWatchOnly}
                >
                  {t('transfer.form.max')}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount}</p>}
          </div>

          {selectedAsset && (
            <div className="space-y-2">
              <Label>{t('transfer.form.fee')}</Label>
              <Input
                readOnly
                value={t('transfer.form.feeValue', { fee: '100' })}
                className="text-center"
              />
              <p className="text-xs text-muted-foreground">
                {t('transfer.form.quBalance', { balance: formatBalance(quBalance) })}
              </p>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        <Button onClick={onContinue} size="lg" className="w-full" disabled={isWatchOnly}>
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
  const [currentIdentity, setCurrentIdentity] = useState(
    localStorage.getItem('currentIdentity') ?? '',
  )
  const [isWatchOnly, setIsWatchOnly] = useState(() =>
    getWatchOnlyAccounts().some(
      (entry) => entry.identity === (localStorage.getItem('currentIdentity') ?? ''),
    ),
  )

  const sdk = useSdk()
  const balance = useBalance(currentIdentity)
  const ownedAssets = useOwnedAssets(currentIdentity)
  const sendMutation = useSend()

  const [step, setStep] = useState<Step>('form')
  const [selectedToken, setSelectedToken] = useState('qu')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [txResult, setTxResult] = useState<TxResult | null>(null)
  const seedRef = useRef<string | null>(null)

  const parsedAssets = aggregateAssets(ownedAssets.data ?? {})

  const hasMultipleTokens = parsedAssets.length > 0
  const selectedAsset =
    selectedToken === 'qu'
      ? null
      : (parsedAssets.find((a) => `${a.issuerIdentity}-${a.name}` === selectedToken) ?? null)

  const handleTokenChange = (value: string) => {
    setSelectedToken(value)
    setAmount('')
    setErrors({})
  }

  useEffect(() => {
    const refreshAccount = () => {
      const nextIdentity = localStorage.getItem('currentIdentity') ?? ''
      setCurrentIdentity(nextIdentity)
      setIsWatchOnly(getWatchOnlyAccounts().some((entry) => entry.identity === nextIdentity))
    }

    refreshAccount()
    window.addEventListener('storage', refreshAccount)
    window.addEventListener('wallet-account-updated', refreshAccount)
    return () => {
      window.removeEventListener('storage', refreshAccount)
      window.removeEventListener('wallet-account-updated', refreshAccount)
    }
  }, [])

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
      } else if (selectedAsset) {
        const assetBalance = BigInt(selectedAsset.numberOfUnits)
        if (parsedAmount > assetBalance) {
          newErrors.amount = t('transfer.validation.amountExceedsBalance')
        }
        const currentQu = normalizeBalance(balance.data?.balance)
        if (currentQu < QX_TRANSFER_ASSET_FEE) {
          newErrors.amount = t('transfer.validation.insufficientQuForFee', { fee: '100' })
        }
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
    if (isWatchOnly) {
      setErrorMessage(t('transfer.errors.watchOnly'))
      return
    }
    if (validateForm()) {
      setStep('auth')
      setErrorMessage('')
    }
  }

  const handleAuthSuccess = (seed: string) => {
    seedRef.current = seed
    setErrorMessage('')
    setStep('form')
    setDrawerOpen(true)
  }

  const handleConfirmSend = async () => {
    const seed = seedRef.current
    if (!seed) return

    setSending(true)
    setErrorMessage('')

    try {
      const parsedAmount = parseAmount(amount)
      if (!parsedAmount) {
        throw new Error(t('transfer.validation.amountInvalid'))
      }

      let result: { txId: string; targetTick: bigint }

      if (selectedAsset) {
        const payload = buildAssetTransferPayload(
          selectedAsset.issuerIdentity,
          recipient.trim(),
          selectedAsset.name,
          parsedAmount,
        )
        result = await sdk.transactions.send({
          fromSeed: seed,
          toIdentity: QX_ADDRESS,
          amount: QX_TRANSFER_ASSET_FEE,
          inputType: QX_TRANSFER_ASSET_INPUT_TYPE,
          inputBytes: payload,
        })
      } else {
        result = await sendMutation.mutateAsync({
          toIdentity: recipient.trim(),
          amount: parsedAmount,
          fromSeed: seed,
        })
      }

      seedRef.current = null

      const tokenName = selectedAsset?.name ?? 'QU'

      setTxResult({
        txId: result.txId,
        targetTick: result.targetTick.toString(),
        amount: parsedAmount,
        tokenName,
      })

      setDrawerOpen(false)
      setStep('success')

      toast.success(t('transfer.success.title'), {
        description: t('transfer.success.description', {
          targetTick: result.targetTick.toString(),
        }),
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

      seedRef.current = null
      setErrorMessage(message)
      setDrawerOpen(false)
      setStep('form')
      toast.error(t('transfer.errors.generic'), {
        description: message,
      })
    } finally {
      setSending(false)
    }
  }

  const handleAuthCancel = () => {
    seedRef.current = null
    setStep('form')
  }

  const handleSendAnother = () => {
    setStep('form')
    setSelectedToken('qu')
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

  const handleMaxAmount = () => {
    let maxAmount: bigint
    if (selectedAsset) {
      maxAmount = BigInt(selectedAsset.numberOfUnits)
    } else {
      maxAmount = normalizeBalance(balance.data?.balance)
    }
    if (maxAmount > 0n) {
      setAmount(maxAmount.toString())
      if (errors.amount) {
        setErrors({ ...errors, amount: undefined })
      }
    }
  }

  if (step === 'auth') {
    return <PassphraseAuth onSuccess={handleAuthSuccess} onCancel={handleAuthCancel} />
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
        isWatchOnly={isWatchOnly}
        hasMultipleTokens={hasMultipleTokens}
        assets={parsedAssets}
        selectedToken={selectedToken}
        selectedAsset={selectedAsset}
        onTokenChange={handleTokenChange}
        onRecipientChange={handleRecipientChange}
        onAmountChange={handleAmountChange}
        quBalance={normalizeBalance(balance.data?.balance)}
        onMaxAmount={handleMaxAmount}
        onContinue={handleContinue}
      />

      <ConfirmationDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) {
            seedRef.current = null
          }
        }}
        recipient={recipient}
        amount={amount}
        tokenName={selectedAsset?.name ?? 'QU'}
        sending={sending}
        onCancel={() => {
          setDrawerOpen(false)
          seedRef.current = null
        }}
        onConfirm={handleConfirmSend}
      />
    </>
  )
}

export default Transfer
