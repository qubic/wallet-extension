import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useBalance, useSdk, useSend } from '@qubic-labs/react'
import { isValidIdentity, normalizeBalance, parseAmount } from '@/lib/utils'
import PassphraseAuth from '@/pages/passphrase-auth'
import { getCachedAccounts, getCurrentIdentity, isWatchOnlyIdentity } from '@/lib/accounts'
import { aggregateAssets, useOwnedAssets } from '@/lib/assets'
import {
  QX_ADDRESS,
  QX_TRANSFER_ASSET_FEE,
  QX_TRANSFER_ASSET_INPUT_TYPE,
  buildAssetTransferPayload,
} from '@/lib/qx'
import {
  addPendingTransaction,
  getPendingOutgoingDebit,
  getPendingTransactionsForIdentity,
  PENDING_SETTLED_EVENT,
  usePendingTransactionsVersion,
} from '@/lib/pending-transactions'
import { useLatestStats } from '@/lib/network-stats'
import ConfirmationDrawer from '@/components/pages/transfer/confirmation-drawer'
import TransferForm from '@/components/pages/transfer/transfer-form'
import TransferSuccess from '@/components/pages/transfer/transfer-success'
import type { FormErrors, TxResult } from '@/components/pages/transfer/types'

type Step = 'form' | 'auth' | 'success'

const TARGET_TICK_OFFSET_MIN = 1
const TARGET_TICK_OFFSET_MAX = 40
const QUICK_TARGET_TICK_OFFSETS = [5, 10, 15] as const

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)

const Transfer = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  usePendingTransactionsVersion()
  const [currentIdentity, setCurrentIdentity] = useState(getCurrentIdentity())
  const [isWatchOnly, setIsWatchOnly] = useState(() => isWatchOnlyIdentity(getCurrentIdentity()))
  const [vaultRecipients, setVaultRecipients] = useState(() => getCachedAccounts())

  const sdk = useSdk()
  const balance = useBalance(currentIdentity)
  const ownedAssets = useOwnedAssets(currentIdentity)
  const sendMutation = useSend()
  const latestStats = useLatestStats('transfer', { staleTime: 5_000 })

  const [step, setStep] = useState<Step>('form')
  const [selectedToken, setSelectedToken] = useState('qu')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [txResult, setTxResult] = useState<TxResult | null>(null)
  const [targetTickOffset, setTargetTickOffset] = useState(10)
  const [isManualTargetTickEnabled, setIsManualTargetTickEnabled] = useState(false)
  const [manualTargetTick, setManualTargetTick] = useState('')
  const seedRef = useRef<string | null>(null)

  const parsedAssets = aggregateAssets(ownedAssets.data ?? {})
  const filteredVaultRecipients = useMemo(
    () =>
      vaultRecipients.filter(
        (entry, index, list) =>
          entry.identity !== currentIdentity &&
          list.findIndex((candidate) => candidate.identity === entry.identity) === index,
      ),
    [currentIdentity, vaultRecipients],
  )
  const selectedAsset =
    selectedToken === 'qu'
      ? null
      : (parsedAssets.find((a) => `${a.issuerIdentity}-${a.name}` === selectedToken) ?? null)
  const parsedAmount = parseAmount(amount)
  const currentTick = latestStats.data?.data?.currentTick
  const pendingForIdentity = getPendingTransactionsForIdentity(currentIdentity)
  const pendingOutgoingDebit = getPendingOutgoingDebit(currentIdentity)
  const hasPendingOutgoing = pendingForIdentity.some((tx) => tx.status === 'pending')
  const onChainQuBalance = normalizeBalance(balance.data?.balance)
  const effectiveQuBalance =
    onChainQuBalance > pendingOutgoingDebit ? onChainQuBalance - pendingOutgoingDebit : 0n
  const usdEstimate = useMemo(() => {
    if (selectedAsset) return '--'
    const usdPricePerQus = latestStats.data?.data?.price
    if (!parsedAmount || !usdPricePerQus) return '--'
    if (parsedAmount > BigInt(Number.MAX_SAFE_INTEGER)) return '--'
    return formatUsd(Number(parsedAmount) * usdPricePerQus)
  }, [latestStats.data?.data?.price, parsedAmount, selectedAsset])

  const handleTokenChange = (value: string) => {
    setSelectedToken(value)
    setAmount('')
    setErrors({})
  }

  useEffect(() => {
    const refreshAccount = () => {
      const nextIdentity = getCurrentIdentity()
      setCurrentIdentity(nextIdentity)
      setIsWatchOnly(isWatchOnlyIdentity(nextIdentity))
      setVaultRecipients(getCachedAccounts())
    }

    refreshAccount()
    window.addEventListener('storage', refreshAccount)
    window.addEventListener('wallet-account-updated', refreshAccount)
    return () => {
      window.removeEventListener('storage', refreshAccount)
      window.removeEventListener('wallet-account-updated', refreshAccount)
    }
  }, [])

  useEffect(() => {
    const prefillRecipient = searchParams.get('recipient')?.trim()
    const prefillAmount = searchParams.get('amount')?.trim()
    let didPrefill = false

    if (prefillRecipient) {
      setRecipient(prefillRecipient.toUpperCase())
      didPrefill = true
    }
    if (prefillAmount && /^\d+$/.test(prefillAmount)) {
      setAmount(prefillAmount)
      didPrefill = true
    }

    if (didPrefill) {
      setErrors({})
      setErrorMessage('')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (selectedToken === 'qu') return
    const exists = parsedAssets.some(
      (asset) => `${asset.issuerIdentity}-${asset.name}` === selectedToken,
    )
    if (!exists) {
      setSelectedToken('qu')
    }
  }, [parsedAssets, selectedToken])

  useEffect(() => {
    if (hasPendingOutgoing) return
    if (errorMessage === t('transfer.errors.pendingOutgoing')) {
      setErrorMessage('')
    }
  }, [errorMessage, hasPendingOutgoing, t])

  useEffect(() => {
    const handlePendingSettled = () => {
      void latestStats.refetch()
      void balance.refetch()
    }
    window.addEventListener(PENDING_SETTLED_EVENT, handlePendingSettled)
    return () => {
      window.removeEventListener(PENDING_SETTLED_EVENT, handlePendingSettled)
    }
  }, [balance, latestStats])

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
        if (effectiveQuBalance < QX_TRANSFER_ASSET_FEE) {
          newErrors.amount = t('transfer.validation.insufficientQuForFee', { fee: '100' })
        }
      } else if (balance.isLoading) {
        newErrors.amount = t('transfer.validation.balanceLoading')
      } else {
        if (parsedAmount > effectiveQuBalance) {
          newErrors.amount = t('transfer.validation.amountExceedsBalance')
        }
      }
    }

    if (isManualTargetTickEnabled) {
      const parsedManualTick = Number.parseInt(manualTargetTick.trim(), 10)
      if (!Number.isFinite(parsedManualTick) || parsedManualTick < 1) {
        newErrors.targetTick = t('transfer.validation.targetTickManualInvalid')
      } else if (typeof currentTick === 'number' && parsedManualTick <= currentTick) {
        newErrors.targetTick = t('transfer.validation.targetTickManualPast')
      }
    } else if (
      !Number.isFinite(targetTickOffset) ||
      targetTickOffset < TARGET_TICK_OFFSET_MIN ||
      targetTickOffset > TARGET_TICK_OFFSET_MAX
    ) {
      newErrors.targetTick = t('transfer.validation.targetTickOffsetInvalid')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (isWatchOnly) {
      setErrorMessage(t('transfer.errors.watchOnly'))
      return
    }
    if (hasPendingOutgoing) {
      setErrorMessage(t('transfer.errors.pendingOutgoing'))
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
      let requestedTargetTick: bigint | number | undefined

      if (isManualTargetTickEnabled) {
        const parsedManualTick = Number.parseInt(manualTargetTick.trim(), 10)
        if (!Number.isFinite(parsedManualTick) || parsedManualTick < 1) {
          throw new Error(t('transfer.validation.targetTickManualInvalid'))
        }
        const latestStatsSnapshot = await latestStats.refetch()
        const sendCurrentTick =
          latestStatsSnapshot.data?.data?.currentTick ?? latestStats.data?.data?.currentTick
        if (typeof sendCurrentTick === 'number' && parsedManualTick <= sendCurrentTick) {
          throw new Error(t('transfer.validation.targetTickManualPast'))
        }
        requestedTargetTick = parsedManualTick
      } else {
        const effectiveOffset = Math.min(
          TARGET_TICK_OFFSET_MAX,
          Math.max(TARGET_TICK_OFFSET_MIN, targetTickOffset),
        )
        try {
          requestedTargetTick = await sdk.tick.getSuggestedTargetTick({
            offset: effectiveOffset,
          })
        } catch {
          const latestStatsSnapshot = await latestStats.refetch()
          const sendCurrentTick =
            latestStatsSnapshot.data?.data?.currentTick ?? latestStats.data?.data?.currentTick
          if (typeof sendCurrentTick === 'number') {
            requestedTargetTick = sendCurrentTick + effectiveOffset
          }
        }
      }

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
          targetTick: requestedTargetTick,
        })
      } else {
        result = await sendMutation.mutateAsync({
          toIdentity: recipient.trim(),
          amount: parsedAmount,
          fromSeed: seed,
          targetTick: requestedTargetTick,
        })
      }

      seedRef.current = null

      const tokenName = selectedAsset?.name ?? 'QU'
      const fee = selectedAsset ? QX_TRANSFER_ASSET_FEE : 0n
      addPendingTransaction({
        hash: result.txId,
        sourceIdentity: currentIdentity,
        destinationIdentity: recipient.trim(),
        amount: selectedAsset ? QX_TRANSFER_ASSET_FEE : parsedAmount,
        quImpact: selectedAsset ? QX_TRANSFER_ASSET_FEE : parsedAmount,
        inputType: selectedAsset ? QX_TRANSFER_ASSET_INPUT_TYPE : 0,
        targetTick: Number(result.targetTick),
      })

      setTxResult({
        txId: result.txId,
        targetTick: result.targetTick.toString(),
        amount: parsedAmount,
        tokenName,
        sourceIdentity: currentIdentity,
        recipient: recipient.trim(),
        fee,
      })

      setDrawerOpen(false)
      setStep('success')

      toast.success(t('transfer.success.title'), {
        description: t('transfer.success.description', {
          targetTick: Number(result.targetTick).toLocaleString(),
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
    setTargetTickOffset(10)
    setIsManualTargetTickEnabled(false)
    setManualTargetTick('')
    setErrors({})
    setErrorMessage('')
    setTxResult(null)
  }

  const handleViewHistory = () => {
    navigate('/history')
  }

  const handleViewDetails = () => {
    if (!txResult?.txId) return
    navigate(`/tx/${txResult.txId}`)
  }

  const handleRecipientChange = (value: string) => {
    setRecipient(value)
    if (errors.recipient) {
      setErrors({ ...errors, recipient: undefined })
    }
  }

  const handleSelectVaultRecipient = (identity: string) => {
    setRecipient(identity)
    if (errors.recipient) {
      setErrors((prev) => ({ ...prev, recipient: undefined }))
    }
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    if (errors.amount) {
      setErrors({ ...errors, amount: undefined })
    }
  }

  const handleTargetTickOffsetChange = (value: number) => {
    const clamped = Math.min(TARGET_TICK_OFFSET_MAX, Math.max(TARGET_TICK_OFFSET_MIN, value))
    setTargetTickOffset(clamped)
    setIsManualTargetTickEnabled(false)
    if (errors.targetTick) {
      setErrors((prev) => ({ ...prev, targetTick: undefined }))
    }
  }

  const handleManualTargetTickChange = (value: string) => {
    setManualTargetTick(value)
    if (errors.targetTick) {
      setErrors((prev) => ({ ...prev, targetTick: undefined }))
    }
  }

  const handleManualTargetTickToggle = () => {
    setIsManualTargetTickEnabled((previous) => !previous)
    if (!isManualTargetTickEnabled && !manualTargetTick) {
      setManualTargetTick((currentTick ?? '').toString())
    }
    if (errors.targetTick) {
      setErrors((prev) => ({ ...prev, targetTick: undefined }))
    }
  }

  if (step === 'success' && txResult) {
    return (
      <TransferSuccess
        txResult={txResult}
        onSendAnother={handleSendAnother}
        onViewHistory={handleViewHistory}
        onViewDetails={handleViewDetails}
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
        isWatchOnly={isWatchOnly}
        assets={parsedAssets}
        vaultRecipients={filteredVaultRecipients}
        selectedToken={selectedToken}
        selectedAsset={selectedAsset}
        targetTickOffset={targetTickOffset}
        manualTargetTick={manualTargetTick}
        isManualTargetTickEnabled={isManualTargetTickEnabled}
        currentTick={currentTick}
        hasPendingOutgoing={hasPendingOutgoing}
        usdEstimate={usdEstimate}
        onTokenChange={handleTokenChange}
        onSelectVaultRecipient={handleSelectVaultRecipient}
        onRecipientChange={handleRecipientChange}
        onAmountChange={handleAmountChange}
        onTargetTickOffsetChange={handleTargetTickOffsetChange}
        onManualTargetTickChange={handleManualTargetTickChange}
        onManualTargetTickToggle={handleManualTargetTickToggle}
        quBalance={effectiveQuBalance}
        onContinue={handleContinue}
        quickTargetTickOffsets={QUICK_TARGET_TICK_OFFSETS}
      />

      {step === 'auth' && (
        <PassphraseAuth
          open={step === 'auth'}
          identity={currentIdentity}
          onSuccess={handleAuthSuccess}
          onCancel={handleAuthCancel}
        />
      )}

      <ConfirmationDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) {
            seedRef.current = null
          }
        }}
        sourceIdentity={currentIdentity}
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
