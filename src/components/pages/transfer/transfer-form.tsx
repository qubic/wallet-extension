import { useEffect, useMemo, useRef, useState } from 'react'
import { RouteIcon, SendIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type AggregatedAsset, formatAssetUnits } from '@/lib/assets'
import { formatBalance, truncateString } from '@/lib/utils'
import type { FormErrors } from '@/components/pages/transfer/types'

type TransferFormProps = {
  recipient: string
  amount: string
  errors: FormErrors
  errorMessage: string
  isWatchOnly: boolean
  assets: AggregatedAsset[]
  vaultRecipients: Array<{ name: string; identity: string }>
  selectedToken: string
  selectedAsset: AggregatedAsset | null
  targetTickOffset: number
  manualTargetTick: string
  isManualTargetTickEnabled: boolean
  currentTick?: number
  hasPendingOutgoing: boolean
  onTokenChange: (value: string) => void
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
  assets,
  vaultRecipients,
  selectedToken,
  selectedAsset,
  quBalance,
  usdEstimate,
  targetTickOffset,
  manualTargetTick,
  isManualTargetTickEnabled,
  currentTick,
  hasPendingOutgoing,
  onTokenChange,
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
  const currentBalance = quBalance
  const selectedTokenLabel = selectedAsset?.name ?? 'QU'
  const usdEstimateDisplay = usdEstimate === '--' ? usdEstimate : `≈ ${usdEstimate}`
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

  const setAmountByRatio = (ratio: number) => {
    if (availableUnits <= 0n) return
    const nextAmount = (availableUnits * BigInt(ratio)) / 100n
    if (nextAmount <= 0n) return
    onAmountChange(nextAmount.toString())
  }

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-4 px-4 pb-2">
        <div className="space-y-5">
          <div
            className={`space-y-3 border-b pb-4 ${
              errors.amount ? 'border-destructive/60' : 'border-border/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>{t('transfer.form.sendAmount')}</span>
              <span className="text-[10px] text-muted-foreground/70">{selectedTokenLabel}</span>
            </div>
            <div className="flex items-end gap-2">
              <Input
                id="amount"
                type="text"
                placeholder="0"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value.replace(/[^\d,]/g, ''))}
                disabled={isWatchOnly || hasPendingOutgoing}
                className={`h-auto border-0 bg-transparent px-0 py-0 text-4xl font-semibold tracking-tight shadow-none ring-0 focus-visible:ring-0 ${errors.amount ? 'text-destructive' : ''}`}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                className={`cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedToken === 'qu'
                    ? 'border-primary/60 bg-primary/10 text-foreground'
                    : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
                onClick={() => onTokenChange('qu')}
                disabled={isWatchOnly || hasPendingOutgoing}
              >
                QU
              </button>
              {assets.map((asset) => {
                const tokenValue = `${asset.issuerIdentity}-${asset.name}`
                const isSelected = selectedToken === tokenValue
                return (
                  <button
                    key={tokenValue}
                    type="button"
                    className={`cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'border-primary/60 bg-primary/10 text-foreground'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                    onClick={() => onTokenChange(tokenValue)}
                    disabled={isWatchOnly || hasPendingOutgoing}
                  >
                    {asset.name}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              {[25, 50, 100].map((ratio) => (
                <button
                  key={`amount-ratio-${ratio}`}
                  type="button"
                  className="cursor-pointer rounded-md border border-border/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWatchOnly || hasPendingOutgoing || availableUnits <= 0n}
                  onClick={() => setAmountByRatio(ratio)}
                >
                  {ratio}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{t('transfer.form.usdEquivalent', { value: usdEstimateDisplay })}</span>
            <span>
              {t('transfer.form.available', {
                balance: availableBalanceText,
                token: selectedTokenLabel,
              })}
            </span>
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}

          <div className="space-y-2 border-t border-border/40 pt-4">
            <Label htmlFor="recipient">{t('transfer.form.recipient')}</Label>
            <div ref={recipientPickerRef} className="relative">
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
                className={`font-mono text-xs ${errors.recipient ? 'border-destructive' : ''}`}
                disabled={isWatchOnly || hasPendingOutgoing}
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
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t('transfer.form.recipientHint')}</span>
              <span>{recipient.length}/60</span>
            </div>
            {errors.recipient && <p className="text-xs text-destructive">{errors.recipient}</p>}
          </div>

          {selectedAsset && (
            <div className="border-t border-border/40 pt-3 text-xs text-muted-foreground">
              <div>{t('transfer.form.feeValue', { fee: '100' })}</div>
              <div>{t('transfer.form.quBalance', { balance: formatBalance(quBalance) })}</div>
            </div>
          )}

          <div className="space-y-2 border-t border-border/40 pt-4">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {isManualTargetTickEnabled
                  ? t('transfer.form.targetTickManual')
                  : t('transfer.form.targetTickOffset')}
              </span>
              <span className="font-mono text-xs text-foreground">
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
                  disabled={isWatchOnly || hasPendingOutgoing}
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
                disabled={isWatchOnly || hasPendingOutgoing}
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
                  disabled={isWatchOnly || hasPendingOutgoing}
                  placeholder={t('transfer.form.targetTickManualPlaceholder')}
                />
                <div className="text-[11px] text-muted-foreground">
                  {t('transfer.form.targetTickCurrentHint', {
                    tick: typeof currentTick === 'number' ? currentTick : '--',
                  })}
                </div>
              </div>
            )}
            {errors.targetTick && <p className="text-xs text-destructive">{errors.targetTick}</p>}
          </div>
        </div>

        {isWatchOnly && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <RouteIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t('transfer.errors.watchOnly')}</span>
          </div>
        )}
        {hasPendingOutgoing && (
          <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
            <RouteIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t('transfer.errors.pendingOutgoing')}</span>
          </div>
        )}

        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

        <Button
          onClick={onContinue}
          size="lg"
          className="w-full"
          disabled={isWatchOnly || hasPendingOutgoing || !recipient.trim() || !amount.trim()}
        >
          <SendIcon className="mr-2 h-4 w-4" />
          {t('transfer.actions.continue')}
        </Button>
      </div>
    </section>
  )
}

export default TransferForm
