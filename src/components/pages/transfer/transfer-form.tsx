import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftIcon, RouteIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type AggregatedAsset, formatAssetUnits } from '@/lib/assets'
import { formatBalance, truncateString } from '@/lib/utils'
import type { FormErrors } from '@/components/pages/transfer/types'

type TransferFormProps = {
  recipient: string
  amount: string
  errors: FormErrors
  errorMessage: string
  isWatchOnly: boolean
  vaultRecipients: Array<{ name: string; identity: string }>
  selectedAsset: AggregatedAsset | null
  targetTickOffset: number
  manualTargetTick: string
  isManualTargetTickEnabled: boolean
  currentTick?: number
  onSelectVaultRecipient: (identity: string) => void
  onRecipientChange: (value: string) => void
  onAmountChange: (value: string) => void
  onTargetTickOffsetChange: (value: number) => void
  onManualTargetTickChange: (value: string) => void
  onManualTargetTickToggle: () => void
  quBalance: bigint
  usdEstimate: string
  onContinue: () => void
  quickTargetTickOffsets: readonly number[]
}

const TransferForm = ({
  recipient,
  amount,
  errors,
  errorMessage,
  isWatchOnly,
  vaultRecipients,
  selectedAsset,
  quBalance,
  usdEstimate,
  targetTickOffset,
  manualTargetTick,
  isManualTargetTickEnabled,
  currentTick,
  onSelectVaultRecipient,
  onRecipientChange,
  onAmountChange,
  onTargetTickOffsetChange,
  onManualTargetTickChange,
  onManualTargetTickToggle,
  onContinue,
  quickTargetTickOffsets,
}: TransferFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentBalance = quBalance
  const selectedTokenLabel = selectedAsset?.name ?? 'QU'
  const usdEstimateDisplay = usdEstimate === '--' ? usdEstimate : `~${usdEstimate}`
  const availableBalanceText = selectedAsset
    ? formatAssetUnits(selectedAsset.numberOfUnits, selectedAsset.decimals)
    : formatBalance(currentBalance)
  const availableUnits = selectedAsset ? BigInt(selectedAsset.numberOfUnits) : currentBalance
  const [isRecipientPickerOpen, setRecipientPickerOpen] = useState(false)
  const recipientPickerRef = useRef<HTMLDivElement | null>(null)
  const filteredVaultRecipients = useMemo(() => {
    const query = recipient.trim().toUpperCase()
    if (!query) return vaultRecipients
    return vaultRecipients.filter((entry) => {
      const identity = entry.identity.toUpperCase()
      const label = entry.name.toUpperCase()
      return identity.includes(query) || label.includes(query)
    })
  }, [recipient, vaultRecipients])

  useEffect(() => {
    if (!isRecipientPickerOpen) return undefined
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (recipientPickerRef.current?.contains(target)) return
      setRecipientPickerOpen(false)
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isRecipientPickerOpen])

  const handleMax = () => {
    if (availableUnits <= 0n) return
    onAmountChange(availableUnits.toString())
  }

  return (
    <section className="flex w-full justify-center">
      <div className="flex min-h-[calc(100vh-64px)] w-full max-w-sm flex-col px-4">
        {/* Header */}
        <div className="relative flex items-center justify-center py-3">
          <button
            type="button"
            className="absolute left-0 cursor-pointer p-1 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => navigate('/transfer')}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {t('transfer.title')} {selectedTokenLabel}
          </h2>
        </div>
        {/* Form fields */}
        <div className="flex flex-1 flex-col gap-5">
          {/* Recipient */}
          <div ref={recipientPickerRef} className="relative space-y-1.5">
            <Input
              id="recipient"
              placeholder={t('transfer.form.recipientPlaceholder')}
              value={recipient}
              onChange={(e) => {
                onRecipientChange(e.target.value.toUpperCase())
                if (vaultRecipients.length > 0) {
                  setRecipientPickerOpen(true)
                }
              }}
              onFocus={() => {
                if (vaultRecipients.length > 0) {
                  setRecipientPickerOpen(true)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setRecipientPickerOpen(false)
                }
              }}
              className={`h-12 text-sm ${errors.recipient ? 'border-destructive' : ''}`}
              disabled={isWatchOnly}
            />

            {vaultRecipients.length > 0 && isRecipientPickerOpen && (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border/60 bg-popover shadow-md">
                <div className="border-b border-border/40 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t('transfer.form.vaultRecipients')}
                </div>
                <div className="max-h-52 overflow-y-auto py-1">
                  {filteredVaultRecipients.length > 0 ? (
                    filteredVaultRecipients.map((entry) => (
                      <button
                        key={`recipient-${entry.identity}`}
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent/60"
                        onClick={() => {
                          onSelectVaultRecipient(entry.identity)
                          setRecipientPickerOpen(false)
                        }}
                      >
                        <span className="truncate">{entry.name}</span>
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                          {truncateString(entry.identity)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {t('transfer.form.vaultRecipientsManual')}
                    </div>
                  )}
                </div>
              </div>
            )}
            {errors.recipient && <p className="text-xs text-destructive">{errors.recipient}</p>}
          </div>

          {/* Amount with Max + token label */}
          <div className="space-y-1.5">
            <div className="relative">
              <Input
                id="amount"
                type="text"
                placeholder={t('transfer.form.amountPlaceholder')}
                value={amount}
                onChange={(e) => onAmountChange(e.target.value.replace(/[^\d,]/g, ''))}
                disabled={isWatchOnly}
                className={`h-12 pr-28 text-sm ${errors.amount ? 'border-destructive' : ''}`}
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

            <div className="flex items-center justify-between px-0.5 text-xs text-muted-foreground">
              {!selectedAsset && <span>{usdEstimateDisplay}</span>}
              <span className={selectedAsset ? 'ml-auto' : ''}>
                {t('transfer.form.available', {
                  balance: availableBalanceText,
                  token: selectedTokenLabel,
                })}
              </span>
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* Asset transfer fee info */}
          {selectedAsset && (
            <div className="rounded-lg border border-border/40 px-3 py-2 text-xs text-muted-foreground">
              <div>{t('transfer.form.feeValue', { fee: '100' })}</div>
              <div>{t('transfer.form.quBalance', { balance: formatBalance(quBalance) })}</div>
            </div>
          )}

          {/* Target tick */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {isManualTargetTickEnabled
                  ? t('transfer.form.targetTickManual')
                  : t('transfer.form.targetTickOffset')}
              </span>
              <span className="text-xs font-medium text-foreground">
                {isManualTargetTickEnabled
                  ? manualTargetTick.trim() || '--'
                  : `+${targetTickOffset}`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickTargetTickOffsets.map((offset) => (
                <button
                  key={`target-offset-${offset}`}
                  type="button"
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    !isManualTargetTickEnabled && targetTickOffset === offset
                      ? 'border-primary/60 bg-primary/10 text-foreground'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                  disabled={isWatchOnly}
                  onClick={() => onTargetTickOffsetChange(offset)}
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
                onClick={onManualTargetTickToggle}
              >
                {t('transfer.form.targetTickOffsetManual')}
              </button>
            </div>
            {isManualTargetTickEnabled && (
              <div className="space-y-1">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={manualTargetTick}
                  onChange={(event) => {
                    onManualTargetTickChange(event.target.value)
                  }}
                  className="h-10 w-full"
                  disabled={isWatchOnly}
                  placeholder={t('transfer.form.targetTickManualPlaceholder')}
                />
                <div className="text-[11px] text-muted-foreground">
                  {t('transfer.form.targetTickCurrentHint', {
                    tick: typeof currentTick === 'number' ? currentTick.toLocaleString() : '--',
                  })}
                </div>
              </div>
            )}
            {errors.targetTick && <p className="text-xs text-destructive">{errors.targetTick}</p>}
          </div>

          {isWatchOnly && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <RouteIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{t('transfer.errors.watchOnly')}</span>
            </div>
          )}
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>

        {/* Bottom buttons */}
        <div className="sticky bottom-0 flex gap-3 bg-background pb-4 pt-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => navigate('/transfer')}
          >
            {t('transfer.actions.cancel')}
          </Button>
          <Button
            size="lg"
            className="flex-1"
            disabled={isWatchOnly || !recipient.trim() || !amount.trim()}
            onClick={onContinue}
          >
            {t('transfer.actions.continue')}
          </Button>
        </div>
      </div>
    </section>
  )
}

export default TransferForm
