import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useBalance, useSdk, useSend } from '@qubic-labs/react'
import { useCurrentIdentity } from '@/hooks/use-current-identity'
import { NATIVE_TOKEN_SYMBOL } from '@/lib/config/constants'
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
import { addPendingTransaction, PENDING_SETTLED_EVENT } from '@/lib/pending-transactions'
import { isWalletLocked } from '@/lib/lock'
import { useLatestStats, useTickInfo, fetchTickInfo } from '@/lib/network-stats'
import ConfirmationDrawer from '@/components/pages/transfer/confirmation-drawer'
import TransferForm from '@/components/pages/transfer/transfer-form'
import type { FormErrors } from '@/components/pages/transfer/types'

type Step = 'form' | 'auth'

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
  const [searchParams] = useSearchParams()
  const initialPrefillRecipient = (searchParams.get('recipient') ?? '').trim().toUpperCase()
  const initialPrefillAmount = (() => {
    const value = (searchParams.get('amount') ?? '').trim()
    return /^\d+$/.test(value) ? value : ''
  })()
  const selectedToken = (searchParams.get('token') ?? 'qu').trim()
  const [isWatchOnly, setIsWatchOnly] = useState(() => isWatchOnlyIdentity(getCurrentIdentity()))
  const [vaultRecipients, setVaultRecipients] = useState(() => getCachedAccounts())
  const handleIdentityRefresh = useCallback((nextIdentity: string) => {
    setIsWatchOnly(isWatchOnlyIdentity(nextIdentity))
    setVaultRecipients(getCachedAccounts())
  }, [])
  const currentIdentity = useCurrentIdentity(handleIdentityRefresh)

  const sdk = useSdk()
  const balance = useBalance(currentIdentity)
  const ownedAssets = useOwnedAssets(currentIdentity)
  const sendMutation = useSend()
  const latestStats = useLatestStats('transfer')
  const tickInfo = useTickInfo('transfer')

  const [step, setStep] = useState<Step>('form')
  const [recipient, setRecipient] = useState(initialPrefillRecipient)
  const [amount, setAmount] = useState(initialPrefillAmount)
  const [errors, setErrors] = useState<FormErrors>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [targetTickOffset, setTargetTickOffset] = useState(10)
  const [isManualTargetTickEnabled, setIsManualTargetTickEnabled] = useState(false)
  const [manualTargetTick, setManualTargetTick] = useState('')
  const seedRef = useRef<string | null>(null)

  const parsedAssets = aggregateAssets(ownedAssets.data ?? {}, true)
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
  const currentTick = tickInfo.data?.tickInfo?.tick
  const onChainQuBalance = normalizeBalance(balance.data?.balance)
  const usdEstimate = useMemo(() => {
    if (selectedAsset) return '--'
    const usdPricePerQus = latestStats.data?.data?.price
    if (!parsedAmount || !usdPricePerQus) return '--'
    if (parsedAmount > BigInt(Number.MAX_SAFE_INTEGER)) return '--'
    return formatUsd(Number(parsedAmount) * usdPricePerQus)
  }, [latestStats.data?.data?.price, parsedAmount, selectedAsset])

  useEffect(() => {
    const handlePendingSettled = () => {
      void tickInfo.refetch()
      void balance.refetch()
    }
    window.addEventListener(PENDING_SETTLED_EVENT, handlePendingSettled)
    return () => {
      window.removeEventListener(PENDING_SETTLED_EVENT, handlePendingSettled)
    }
  }, [balance, tickInfo])

  useEffect(() => {
    const handleLockUpdate = () => {
      if (!isWalletLocked()) return
      seedRef.current = null
      setDrawerOpen(false)
      setStep('form')
      setSending(false)
    }

    window.addEventListener('wallet-lock-updated', handleLockUpdate)
    return () => {
      window.removeEventListener('wallet-lock-updated', handleLockUpdate)
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
        if (onChainQuBalance < QX_TRANSFER_ASSET_FEE) {
          newErrors.amount = t('transfer.validation.insufficientQuForFee', { fee: '100' })
        }
      } else if (balance.isLoading) {
        newErrors.amount = t('transfer.validation.balanceLoading')
      } else {
        if (parsedAmount > onChainQuBalance) {
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
    if (validateForm()) {
      setErrorMessage('')
      setDrawerOpen(true)
    }
  }

  const handleAuthSuccess = (seed: string) => {
    seedRef.current = seed
    setErrorMessage('')
    setStep('form')
    void handleConfirmSend(seed)
  }

  const handleConfirmSend = async (seedArg?: string) => {
    const seed = seedArg ?? seedRef.current
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

      // Fetch fresh tick info at send time
      const freshTickInfo = await fetchTickInfo()
      const sendCurrentTick = freshTickInfo.tickInfo?.tick

      if (isManualTargetTickEnabled) {
        const parsedManualTick = Number.parseInt(manualTargetTick.trim(), 10)
        if (!Number.isFinite(parsedManualTick) || parsedManualTick < 1) {
          throw new Error(t('transfer.validation.targetTickManualInvalid'))
        }
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
          if (typeof sendCurrentTick === 'number') {
            requestedTargetTick = sendCurrentTick + effectiveOffset
          }
        }
      }

      if (requestedTargetTick === undefined) {
        throw new Error(t('transfer.errors.networkError'))
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

      addPendingTransaction({
        hash: result.txId,
        sourceIdentity: currentIdentity,
        destinationIdentity: recipient.trim(),
        amount: parsedAmount,
        inputType: selectedAsset ? QX_TRANSFER_ASSET_INPUT_TYPE : 0,
        tokenKey: selectedAsset ? `${selectedAsset.issuerIdentity}-${selectedAsset.name}` : 'qu',
        targetTick: Number(result.targetTick),
      })

      setDrawerOpen(false)

      toast.success(t('transfer.success.title'), {
        description: t('transfer.success.description', {
          targetTick: Number(result.targetTick).toLocaleString(),
        }),
      })

      balance.refetch()
      if (selectedAsset) {
        ownedAssets.refetch()
      }

      navigate('/')
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
    setDrawerOpen(true)
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

  return (
    <>
      <TransferForm
        recipient={recipient}
        amount={amount}
        errors={errors}
        errorMessage={errorMessage}
        isWatchOnly={isWatchOnly}
        isAssetLoading={selectedToken !== 'qu' && !selectedAsset}
        vaultRecipients={filteredVaultRecipients}
        selectedAsset={selectedAsset}
        targetTickOffset={targetTickOffset}
        manualTargetTick={manualTargetTick}
        isManualTargetTickEnabled={isManualTargetTickEnabled}
        currentTick={currentTick}
        usdEstimate={usdEstimate}
        onSelectVaultRecipient={handleSelectVaultRecipient}
        onRecipientChange={handleRecipientChange}
        onAmountChange={handleAmountChange}
        onTargetTickOffsetChange={handleTargetTickOffsetChange}
        onManualTargetTickChange={handleManualTargetTickChange}
        onManualTargetTickToggle={handleManualTargetTickToggle}
        quBalance={onChainQuBalance}
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
        tokenName={selectedAsset?.name ?? NATIVE_TOKEN_SYMBOL}
        sending={sending}
        onCancel={() => {
          setDrawerOpen(false)
          seedRef.current = null
        }}
        onConfirm={() => {
          setStep('auth')
        }}
      />
    </>
  )
}

export default Transfer
