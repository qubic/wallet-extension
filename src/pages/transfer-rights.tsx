import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useBalance, useSdk } from '@qubic-labs/react'
import { AlertTriangleIcon, ChevronRightIcon, RouteIcon, SendIcon, XIcon } from 'lucide-react'
import PageHeader from '@/components/page-header'
import { Button } from '@/components/ui/button'
import NumericInput from '@/components/numeric-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import SummaryRow from '@/components/pages/transfer/summary-row'
import PassphraseAuth from '@/pages/passphrase-auth'
import { isWatchOnlyIdentity } from '@/lib/accounts'
import { useCurrentIdentity } from '@/hooks/use-current-identity'
import { formatAssetUnits, getAssetsPerContract, useOwnedAssets } from '@/lib/assets'
import { useSmartContracts } from '@/lib/qubic-static'
import type { SmartContract } from '@/lib/qubic-static.types'
import { QX_CONTRACT_INDEX } from '@/lib/config/constants'
import type { ManagementRightsProcedureType } from '@/lib/transfer-rights'
import {
  PROCEDURE_TYPE_REVOKE,
  buildRevokeRightsPayload,
  buildTransferRightsPayload,
  canReceiveTransferShares,
  findManagementRightsProcedure,
  hasManagementRightsProcedure,
} from '@/lib/transfer-rights'
import { addPendingTransaction, PENDING_SETTLED_EVENT } from '@/lib/pending-transactions'
import { isWalletLocked } from '@/lib/lock'
import { useTickInfo, fetchTickInfo } from '@/lib/network-stats'
import { isRequestedTargetTickExpiredNow } from '@/lib/target-tick'
import {
  compareBigIntDesc,
  formatBalance,
  formatNumber,
  normalizeBalance,
  parseAmount,
  truncateString,
} from '@/lib/utils'

type Step = 'select-asset' | 'form' | 'auth'
type FormErrors = {
  sourceContract?: string
  destinationContract?: string
  shares?: string
  fee?: string
  targetTick?: string
}

type AssetGroup = {
  name: string
  issuerIdentity: string
  decimals: number
  contracts: Array<{
    contractIndex: number
    contractName: string
    contractAddress: string
    numberOfUnits: string
    procedureId: number
    procedureFee: number
    procedureType: ManagementRightsProcedureType
  }>
}

const TARGET_TICK_OFFSET_MIN = 1
const TARGET_TICK_OFFSET_MAX = 40
const QUICK_TARGET_TICK_OFFSETS = [5, 10, 15] as const

const TransferRights = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedAsset = searchParams.get('asset') ?? ''
  const preselectedContract = searchParams.get('contractIndex')

  const [isWatchOnly, setIsWatchOnly] = useState(false)
  const handleIdentityRefresh = useCallback(
    (identity: string) => setIsWatchOnly(isWatchOnlyIdentity(identity)),
    [],
  )
  const currentIdentity = useCurrentIdentity(handleIdentityRefresh)

  const sdk = useSdk()
  const balance = useBalance(currentIdentity)
  const ownedAssets = useOwnedAssets(currentIdentity)
  const smartContracts = useSmartContracts()
  const tickInfo = useTickInfo('transfer-rights')

  const [step, setStep] = useState<Step>(preselectedAsset ? 'form' : 'select-asset')
  const [selectedAssetKey, setSelectedAssetKey] = useState(preselectedAsset)
  const [selectedSourceIndex, setSelectedSourceIndex] = useState<number | null>(
    preselectedContract ? Number(preselectedContract) : null,
  )
  const [selectedDestIndex, setSelectedDestIndex] = useState<number | null>(null)
  const [shares, setShares] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [errorMessage, setErrorMessage] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [targetTickOffset, setTargetTickOffset] = useState(10)
  const [isManualTargetTickEnabled, setIsManualTargetTickEnabled] = useState(false)
  const [manualTargetTick, setManualTargetTick] = useState('')
  const seedRef = useRef<string | null>(null)

  const onChainQuBalance = normalizeBalance(balance.data?.balance)
  const currentTick = tickInfo.data?.tickInfo?.tick

  // Build source-eligible contracts map (contracts that have a management rights procedure)
  const contractsMap = useMemo(() => {
    const map = new Map<number, SmartContract>()
    for (const sc of smartContracts.data ?? []) {
      if (hasManagementRightsProcedure(sc)) {
        map.set(sc.contractIndex, sc)
      }
    }
    return map
  }, [smartContracts.data])

  // Build asset groups with per-contract data
  const assetGroups = useMemo((): AssetGroup[] => {
    if (!ownedAssets.data || contractsMap.size === 0) return []

    const perContract = getAssetsPerContract(ownedAssets.data)
    const groupMap = new Map<string, AssetGroup>()

    for (const entry of perContract) {
      const contract = contractsMap.get(entry.managingContractIndex)
      if (!contract) continue

      const result = findManagementRightsProcedure(contract)
      if (!result || result.procedure.fee == null || result.procedure.fee < 0) continue

      const key = `${entry.issuerIdentity}-${entry.name}`
      let group = groupMap.get(key)
      if (!group) {
        group = {
          name: entry.name,
          issuerIdentity: entry.issuerIdentity,
          decimals: entry.decimals,
          contracts: [],
        }
        groupMap.set(key, group)
      }

      group.contracts.push({
        contractIndex: entry.managingContractIndex,
        contractName: contract.name,
        contractAddress: contract.address,
        numberOfUnits: entry.numberOfUnits,
        procedureId: result.procedure.id,
        procedureFee: result.procedure.fee,
        procedureType: result.type,
      })
    }

    for (const group of groupMap.values()) {
      group.contracts.sort((a, b) => compareBigIntDesc(a.numberOfUnits, b.numberOfUnits))
    }

    return [...groupMap.values()]
  }, [ownedAssets.data, contractsMap])

  const selectedGroup = assetGroups.find(
    (g) => `${g.issuerIdentity}-${g.name}` === selectedAssetKey,
  )

  const sourceContract = selectedGroup?.contracts.find(
    (c) => c.contractIndex === selectedSourceIndex,
  )

  // Destination options depend on source contract's procedure type:
  // - revoke: destination is only QX
  // - transfer: destination is contracts with allowTransferShares + management rights procedure
  const destinationOptions = useMemo(() => {
    if (!smartContracts.data || selectedSourceIndex === null) return []

    if (sourceContract?.procedureType === PROCEDURE_TYPE_REVOKE) {
      return smartContracts.data.filter((sc) => sc.contractIndex === QX_CONTRACT_INDEX)
    }

    return smartContracts.data
      .filter(
        (sc) =>
          canReceiveTransferShares(sc) &&
          hasManagementRightsProcedure(sc) &&
          sc.contractIndex !== selectedSourceIndex,
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [smartContracts.data, selectedSourceIndex, sourceContract?.procedureType])

  const destinationContract = destinationOptions.find(
    (sc) => sc.contractIndex === selectedDestIndex,
  )

  // Auto-select: if only one source contract, select it; auto-select QX as destination
  useEffect(() => {
    if (!selectedGroup) return
    if (selectedGroup.contracts.length === 1 && selectedSourceIndex === null) {
      setSelectedSourceIndex(selectedGroup.contracts[0].contractIndex)
    }
  }, [selectedGroup, selectedSourceIndex])

  useEffect(() => {
    if (selectedSourceIndex === null || selectedDestIndex !== null) return
    if (destinationOptions.length === 1) {
      setSelectedDestIndex(destinationOptions[0].contractIndex)
    }
  }, [selectedSourceIndex, selectedDestIndex, destinationOptions])

  useEffect(() => {
    const handlePendingSettled = () => {
      void tickInfo.refetch()
      void balance.refetch()
      void ownedAssets.refetch()
    }
    window.addEventListener(PENDING_SETTLED_EVENT, handlePendingSettled)
    return () => {
      window.removeEventListener(PENDING_SETTLED_EVENT, handlePendingSettled)
    }
  }, [balance, tickInfo, ownedAssets])

  useEffect(() => {
    const handleLockUpdate = () => {
      if (!isWalletLocked()) return
      seedRef.current = null
      setDrawerOpen(false)
      setStep(selectedAssetKey ? 'form' : 'select-asset')
      setSending(false)
    }
    window.addEventListener('wallet-lock-updated', handleLockUpdate)
    return () => {
      window.removeEventListener('wallet-lock-updated', handleLockUpdate)
    }
  }, [selectedAssetKey])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (selectedSourceIndex === null) {
      newErrors.sourceContract = t('transferRights.validation.sourceRequired')
    }
    if (selectedDestIndex === null) {
      newErrors.destinationContract = t('transferRights.validation.destinationRequired')
    }
    if (selectedSourceIndex !== null && selectedSourceIndex === selectedDestIndex) {
      newErrors.destinationContract = t('transferRights.validation.sameContract')
    }

    if (!shares.trim()) {
      newErrors.shares = t('transferRights.validation.sharesRequired')
    } else {
      const parsed = parseAmount(shares)
      if (!parsed || parsed <= 0n) {
        newErrors.shares = t('transferRights.validation.sharesInvalid')
      } else if (sourceContract && parsed > BigInt(sourceContract.numberOfUnits)) {
        newErrors.shares = t('transferRights.validation.sharesExceedsBalance')
      }
    }

    if (sourceContract) {
      const fee = BigInt(sourceContract.procedureFee)
      if (onChainQuBalance < fee) {
        newErrors.fee = t('transferRights.validation.insufficientQuForFee', {
          fee: sourceContract.procedureFee.toString(),
        })
      }
    }

    if (isManualTargetTickEnabled) {
      const parsedManualTick = Number(parseAmount(manualTargetTick) ?? Number.NaN)
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
      setErrorMessage(t('transferRights.errors.watchOnly'))
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
    if (!seed || !sourceContract || !destinationContract || !selectedGroup) return

    const isRevoke = sourceContract.procedureType === PROCEDURE_TYPE_REVOKE

    setSending(true)
    setErrorMessage('')
    let requestedTargetTick: bigint | number | undefined

    try {
      const parsedShares = parseAmount(shares)
      if (!parsedShares) {
        throw new Error(t('transferRights.validation.sharesInvalid'))
      }

      const freshTickInfo = await fetchTickInfo()
      const sendCurrentTick = freshTickInfo.tickInfo?.tick

      if (isManualTargetTickEnabled) {
        const parsedManualTick = Number(parseAmount(manualTargetTick) ?? Number.NaN)
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
        throw new Error(t('transferRights.errors.networkError'))
      }

      let payload: Uint8Array
      if (isRevoke) {
        payload = buildRevokeRightsPayload(
          selectedGroup.issuerIdentity,
          selectedGroup.name,
          parsedShares,
        )
      } else {
        payload = buildTransferRightsPayload(
          selectedGroup.issuerIdentity,
          selectedGroup.name,
          parsedShares,
          destinationContract.contractIndex,
        )
      }

      const result = await sdk.transactions.send({
        fromSeed: seed,
        toIdentity: sourceContract.contractAddress,
        amount: BigInt(sourceContract.procedureFee),
        inputType: sourceContract.procedureId,
        inputBytes: payload,
        targetTick: requestedTargetTick,
      })

      seedRef.current = null

      addPendingTransaction({
        hash: result.txId,
        sourceIdentity: currentIdentity,
        destinationIdentity: sourceContract.contractAddress,
        amount: BigInt(sourceContract.procedureFee),
        inputType: sourceContract.procedureId,
        tokenKey: `${selectedGroup.issuerIdentity}-${selectedGroup.name}`,
        targetTick: Number(result.targetTick),
      })

      setDrawerOpen(false)

      toast.success(t('transferRights.success.title'), {
        description: t('transaction.broadcastDescription', {
          targetTick: formatNumber(Number(result.targetTick)),
        }),
      })

      void balance.refetch()
      void ownedAssets.refetch()

      navigate('/')
    } catch (error) {
      let message = t('transferRights.errors.generic')

      if (error instanceof Error) {
        const targetTickExpired = await isRequestedTargetTickExpiredNow(requestedTargetTick)
        if (targetTickExpired) {
          message = t('transferRights.errors.targetTickExpired')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          message = t('transferRights.errors.networkError')
        } else if (error.message.includes('broadcast')) {
          message = t('transferRights.errors.broadcastFailed')
        } else {
          message = error.message
        }
      }

      seedRef.current = null
      setErrorMessage(message)
      setDrawerOpen(false)
      setStep('form')
      toast.error(t('transferRights.errors.generic'), {
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

  const handleSelectAsset = (assetKey: string, contractIndex?: number) => {
    setSelectedAssetKey(assetKey)
    if (contractIndex !== undefined) {
      setSelectedSourceIndex(contractIndex)
    }
    setSelectedDestIndex(null)
    setShares('')
    setErrors({})
    setErrorMessage('')
    setStep('form')
  }

  const handleBack = () => {
    if (step === 'form' && !preselectedAsset) {
      setStep('select-asset')
    } else {
      navigate(-1)
    }
  }

  const handleMax = () => {
    if (!sourceContract) return
    setShares(formatNumber(BigInt(sourceContract.numberOfUnits)))
  }

  // Asset selection screen
  if (step === 'select-asset') {
    return (
      <section className="flex w-full justify-center pt-4">
        <div className="flex w-full max-w-sm flex-col gap-4 px-4 pb-2">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t('transferRights.title')}</h2>
            <p className="text-xs text-muted-foreground">
              {t('transferRights.selectAssetSubtitle')}
            </p>
          </div>

          <div className="space-y-2">
            {assetGroups.map((group) => {
              const assetKey = `${group.issuerIdentity}-${group.name}`
              const totalUnits = group.contracts
                .reduce((sum, c) => sum + BigInt(c.numberOfUnits), 0n)
                .toString()
              return (
                <button
                  key={assetKey}
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card"
                  onClick={() => handleSelectAsset(assetKey)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xs font-bold text-primary">{group.name.slice(0, 3)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{group.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatAssetUnits(totalUnits, group.decimals)} {group.name}
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              )
            })}

            {!ownedAssets.isLoading && !smartContracts.isLoading && assetGroups.length === 0 && (
              <div className="py-2 text-center text-xs text-muted-foreground">
                {t('transferRights.noAssets')}
              </div>
            )}

            {(ownedAssets.isLoading || smartContracts.isLoading) && (
              <div className="space-y-2">
                <div className="h-14 animate-pulse rounded-lg bg-muted/25" />
                <div className="h-14 animate-pulse rounded-lg bg-muted/25" />
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Form + confirmation + auth
  const selectedTokenLabel = selectedGroup?.name ?? ''
  const availableUnits = sourceContract ? BigInt(sourceContract.numberOfUnits) : 0n

  return (
    <>
      <section className="flex w-full justify-center">
        <div className="flex min-h-[calc(100vh-64px)] w-full max-w-sm flex-col px-4">
          <PageHeader title={t('transferRights.title')} onBack={handleBack} />

          {/* Form fields */}
          <div className="flex flex-1 flex-col gap-5">
            {/* Asset label */}
            {selectedGroup && (
              <div className="rounded-lg border border-border/40 px-3 py-2 text-sm font-medium text-foreground">
                {selectedGroup.name}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {t('transferRights.confirm.issuedBy', {
                    issuer: truncateString(selectedGroup.issuerIdentity),
                  })}
                </span>
              </div>
            )}

            {/* Source contract */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="sourceContract">
                {t('transferRights.sourceContract')}
              </label>
              <Select
                value={selectedSourceIndex !== null ? String(selectedSourceIndex) : ''}
                onValueChange={(value) => {
                  const idx = Number(value)
                  setSelectedSourceIndex(idx)
                  setSelectedDestIndex(null)
                  setShares('')
                  setErrors((prev) => ({
                    ...prev,
                    sourceContract: undefined,
                    destinationContract: undefined,
                    shares: undefined,
                  }))
                }}
                disabled={isWatchOnly || !selectedGroup || selectedGroup.contracts.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('transferRights.sourceContractPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {selectedGroup?.contracts.map((c) => (
                    <SelectItem key={c.contractIndex} value={String(c.contractIndex)}>
                      {c.contractName} — {formatAssetUnits(c.numberOfUnits, selectedGroup.decimals)}{' '}
                      {selectedGroup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sourceContract && (
                <p className="text-xs text-destructive">{errors.sourceContract}</p>
              )}
            </div>

            {/* Destination contract */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="destinationContract"
              >
                {t('transferRights.destinationContract')}
              </label>
              <Select
                value={selectedDestIndex !== null ? String(selectedDestIndex) : ''}
                onValueChange={(value) => {
                  setSelectedDestIndex(Number(value))
                  setErrors((prev) => ({ ...prev, destinationContract: undefined }))
                }}
                disabled={
                  isWatchOnly || selectedSourceIndex === null || destinationOptions.length === 0
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('transferRights.destinationContractPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.map((sc) => (
                    <SelectItem key={sc.contractIndex} value={String(sc.contractIndex)}>
                      {sc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSourceIndex !== null && destinationOptions.length === 0 && (
                <div className="py-1 text-xs text-muted-foreground">
                  {t('transferRights.noDestinationContracts')}
                </div>
              )}
              {errors.destinationContract && (
                <p className="text-xs text-destructive">{errors.destinationContract}</p>
              )}
              {sourceContract?.procedureType === PROCEDURE_TYPE_REVOKE && (
                <p className="text-xs text-muted-foreground">
                  {t('transferRights.revokeOnlyHint', {
                    contract: sourceContract.contractName,
                  })}
                </p>
              )}
            </div>

            {/* Number of shares */}
            <div className="space-y-1.5">
              <div className="relative">
                <NumericInput
                  id="shares"
                  placeholder={t('transferRights.numberOfSharesPlaceholder')}
                  value={shares}
                  onChange={(value) => {
                    setShares(value)
                    if (errors.shares) {
                      setErrors((prev) => ({ ...prev, shares: undefined }))
                    }
                  }}
                  disabled={isWatchOnly || !sourceContract}
                  className={`h-12 pr-28 text-sm ${errors.shares ? 'border-destructive' : ''}`}
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">{selectedTokenLabel}</span>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isWatchOnly || availableUnits <= 0n}
                    onClick={handleMax}
                  >
                    {t('transfer.form.max')}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end px-0.5 text-xs text-muted-foreground">
                <span>
                  {t('transferRights.available', {
                    balance: sourceContract
                      ? formatAssetUnits(sourceContract.numberOfUnits, selectedGroup?.decimals)
                      : '--',
                    token: selectedTokenLabel,
                  })}
                </span>
              </div>
              {errors.shares && <p className="text-xs text-destructive">{errors.shares}</p>}
            </div>

            {/* Fee info */}
            {sourceContract && (
              <div className="space-y-1.5">
                <div className="rounded-lg border border-border/40 px-3 py-2 text-xs text-muted-foreground">
                  <div>
                    {t('transferRights.fee', { fee: sourceContract.procedureFee.toString() })}
                  </div>
                  <div>
                    {t('transferRights.quBalance', { balance: formatBalance(onChainQuBalance) })}
                  </div>
                </div>
                {errors.fee && <p className="text-xs text-destructive">{errors.fee}</p>}
              </div>
            )}

            {/* Target tick */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {isManualTargetTickEnabled
                  ? t('transfer.form.targetTickManual')
                  : t('transfer.form.targetTickOffset')}
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_TARGET_TICK_OFFSETS.map((offset) => (
                  <button
                    key={`target-offset-${offset}`}
                    type="button"
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      !isManualTargetTickEnabled && targetTickOffset === offset
                        ? 'border-primary/60 bg-primary/10 text-foreground'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                    disabled={isWatchOnly}
                    onClick={() => {
                      setTargetTickOffset(offset)
                      setIsManualTargetTickEnabled(false)
                      if (errors.targetTick) {
                        setErrors((prev) => ({ ...prev, targetTick: undefined }))
                      }
                    }}
                  >
                    +{offset}
                  </button>
                ))}
                <button
                  type="button"
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    isManualTargetTickEnabled
                      ? 'border-primary/60 bg-primary/10 text-foreground'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                  disabled={isWatchOnly}
                  onClick={() => {
                    setIsManualTargetTickEnabled((prev) => !prev)
                    if (!isManualTargetTickEnabled && !manualTargetTick) {
                      setManualTargetTick(currentTick ? formatNumber(currentTick) : '')
                    }
                    if (errors.targetTick) {
                      setErrors((prev) => ({ ...prev, targetTick: undefined }))
                    }
                  }}
                >
                  {t('transfer.form.targetTickOffsetManual')}
                </button>
              </div>
              {isManualTargetTickEnabled && (
                <div className="space-y-1">
                  <NumericInput
                    value={manualTargetTick}
                    onChange={(value) => {
                      setManualTargetTick(value)
                      if (errors.targetTick) {
                        setErrors((prev) => ({ ...prev, targetTick: undefined }))
                      }
                    }}
                    className="h-12 w-full text-sm"
                    disabled={isWatchOnly}
                    placeholder={t('transfer.form.targetTickManualPlaceholder')}
                  />
                  <div className="text-[11px] text-muted-foreground">
                    {t('transfer.form.targetTickCurrentHint', {
                      tick: typeof currentTick === 'number' ? formatNumber(currentTick) : '--',
                    })}
                  </div>
                </div>
              )}
              {errors.targetTick && <p className="text-xs text-destructive">{errors.targetTick}</p>}
            </div>

            {isWatchOnly && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <RouteIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{t('transferRights.errors.watchOnly')}</span>
              </div>
            )}
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          </div>

          {/* Bottom buttons */}
          <div className="sticky bottom-0 flex gap-3 bg-background pb-4 pt-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={handleBack}>
              {t('transferRights.actions.cancel')}
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={
                isWatchOnly || !sourceContract || selectedDestIndex === null || !shares.trim()
              }
              onClick={handleContinue}
            >
              {t('common.continue')}
            </Button>
          </div>
        </div>
      </section>

      {/* Auth step */}
      {step === 'auth' && (
        <PassphraseAuth
          open={step === 'auth'}
          identity={currentIdentity}
          onSuccess={handleAuthSuccess}
          onCancel={handleAuthCancel}
        />
      )}

      {/* Confirmation drawer */}
      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) {
            seedRef.current = null
          }
        }}
      >
        <DrawerContent className="min-h-[56vh] border-none bg-background">
          <DrawerHeader>
            <DrawerTitle>{t('transferRights.confirm.title')}</DrawerTitle>
            <DrawerDescription>{t('transferRights.confirm.description')}</DrawerDescription>
            <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{t('transferRights.confirm.warning')}</span>
            </div>
          </DrawerHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-2">
            <div className="space-y-3">
              <div className="space-y-1 first:border-t-0 first:pt-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {t('transferRights.confirm.asset')}
                </div>
                <div className="text-sm text-foreground">
                  {selectedGroup?.name}
                  {selectedGroup && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {t('transferRights.confirm.issuedBy', {
                        issuer: truncateString(selectedGroup.issuerIdentity),
                      })}
                    </span>
                  )}
                </div>
              </div>
              <SummaryRow
                label={t('transferRights.confirm.from')}
                value={sourceContract?.contractName ?? ''}
              />
              <SummaryRow
                label={t('transferRights.confirm.to')}
                value={destinationContract?.name ?? ''}
              />
              <SummaryRow
                label={t('transferRights.confirm.amount')}
                value={`${formatAssetUnits(String(parseAmount(shares) ?? 0n), selectedGroup?.decimals)} ${selectedTokenLabel}`}
              />
              {sourceContract && (
                <SummaryRow
                  label={t('transferRights.confirm.feeLabel')}
                  value={`${sourceContract.procedureFee} QU`}
                />
              )}
            </div>
          </div>

          <DrawerFooter>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  setDrawerOpen(false)
                  setStep('auth')
                }}
                size="lg"
                className="w-full gap-2"
                disabled={sending}
              >
                <SendIcon className="h-4 w-4" />
                {sending
                  ? t('transferRights.actions.sending')
                  : t('transferRights.actions.confirm')}
              </Button>
              <Button
                onClick={() => {
                  setDrawerOpen(false)
                  seedRef.current = null
                }}
                variant="ghost"
                size="sm"
                className="w-full gap-2"
                disabled={sending}
              >
                <XIcon className="h-4 w-4" />
                {t('transferRights.actions.cancel')}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default TransferRights
