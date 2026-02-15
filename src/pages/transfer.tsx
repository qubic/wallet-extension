import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CopyIcon,
  RouteIcon,
  SendIcon,
  XIcon,
} from 'lucide-react'
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import {
  formatBalance,
  isValidIdentity,
  normalizeBalance,
  parseAmount,
  truncateString,
} from '@/lib/utils'
import PassphraseAuth from '@/pages/passphrase-auth'
import {
  getCachedAccounts,
  getCurrentIdentity,
  getWatchOnlyAccounts,
  isWatchOnlyIdentity,
} from '@/lib/accounts'
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
import {
  addPendingTransaction,
  getPendingOutgoingDebit,
  getPendingTransactionsForIdentity,
  PENDING_SETTLED_EVENT,
  usePendingTransactionsVersion,
} from '@/lib/pending-transactions'
import { setOnboarded } from '@/lib/vault'
import { useLatestStats } from '@/lib/network-stats'
import { useClipboardCopy } from '@/hooks/use-clipboard-copy'

type Step = 'form' | 'auth' | 'success'

type FormErrors = {
  recipient?: string
  amount?: string
  targetTick?: string
}

type TxResult = {
  txId: string
  targetTick: string
  amount: bigint
  tokenName: string
  sourceIdentity: string
  recipient: string
  fee: bigint
}

type SourceAccount = {
  name: string
  identity: string
  watchOnly?: boolean
}

const TARGET_TICK_OFFSET_MIN = 1
const TARGET_TICK_OFFSET_MAX = 40
const QUICK_TARGET_TICK_OFFSETS = [5, 10, 15] as const

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)

const getSourceAccounts = (): SourceAccount[] => {
  const cached = getCachedAccounts().map((entry) => ({
    name: entry.name,
    identity: entry.identity,
    watchOnly: false,
  }))
  const watchOnly = getWatchOnlyAccounts().map((entry) => ({
    name: entry.name,
    identity: entry.identity,
    watchOnly: true,
  }))
  return [...cached, ...watchOnly].filter(
    (entry, index, list) =>
      list.findIndex((candidate) => candidate.identity === entry.identity) === index,
  )
}

const SummaryRow = ({
  label,
  value,
  mono = false,
  emphasize = false,
  copyLabel,
  onCopy,
}: {
  label: string
  value: string
  mono?: boolean
  emphasize?: boolean
  copyLabel?: string
  onCopy?: () => void
}) => (
  <div className="space-y-1 border-t border-border/40 pt-3 first:border-t-0 first:pt-0">
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
      <span>{label}</span>
      {onCopy && copyLabel && (
        <button
          type="button"
          className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          onClick={onCopy}
          aria-label={copyLabel}
        >
          <CopyIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
    <div
      className={`break-all ${mono ? 'font-mono' : ''} ${
        emphasize ? 'text-lg font-semibold tabular-nums text-foreground' : 'text-sm text-foreground'
      }`}
    >
      {value}
    </div>
  </div>
)

const TransferSuccess = ({
  txResult,
  onSendAnother,
  onViewHistory,
  onViewDetails,
}: {
  txResult: TxResult
  onSendAnother: () => void
  onViewHistory: () => void
  onViewDetails: () => void
}) => {
  const { t } = useTranslation()
  const { copyText } = useClipboardCopy()

  const handleCopyTxId = async () => {
    await copyText(txResult.txId, {
      messages: {
        successTitle: t('home.toast.copySuccess'),
        successDescription: t('home.toast.copySuccessDesc'),
        errorTitle: t('home.toast.copyFail'),
        errorDescription: t('home.toast.copyFailDesc'),
      },
    })
  }

  return (
    <section className="flex w-full justify-center pt-4">
      <div className="flex w-full max-w-sm flex-col gap-6 px-4">
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

          <div className="w-full space-y-3 text-left">
            <SummaryRow label={t('transfer.form.from')} value={txResult.sourceIdentity} mono />
            <SummaryRow label={t('transfer.confirm.to')} value={txResult.recipient} mono />
            <SummaryRow
              label={t('transfer.success.amount')}
              value={`${formatBalance(txResult.amount)} ${txResult.tokenName}`}
              emphasize
            />
            <SummaryRow label={t('transfer.success.targetTick')} value={txResult.targetTick} mono />
            {txResult.fee > 0n && (
              <SummaryRow
                label={t('transfer.confirm.fee', { fee: '100' })}
                value={`${formatBalance(txResult.fee)} QU`}
              />
            )}
            <SummaryRow
              label={t('transfer.success.txId')}
              value={txResult.txId}
              mono
              copyLabel={t('home.receive.copy')}
              onCopy={handleCopyTxId}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onViewDetails} variant="secondary" size="lg" className="w-full">
            {t('history.details.title')}
          </Button>
          <Button onClick={onViewHistory} variant="outline" size="lg" className="w-full">
            {t('transfer.success.viewHistory')}
          </Button>
          <Button onClick={onSendAnother} size="lg" className="w-full">
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
  sourceIdentity,
  recipient,
  amount,
  tokenName,
  sending,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceIdentity: string
  recipient: string
  amount: string
  tokenName: string
  sending: boolean
  onCancel: () => void
  onConfirm: () => void
}) => {
  const { t } = useTranslation()
  const parsed = parseAmount(amount) || 0n

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="min-h-[56vh] border-none bg-background">
        <DrawerHeader>
          <DrawerTitle>{t('transfer.confirm.title')}</DrawerTitle>
          <DrawerDescription>{t('transfer.confirm.description')}</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-2">
          <div className="space-y-3">
            <SummaryRow label={t('transfer.form.from')} value={sourceIdentity} mono />
            <SummaryRow label={t('transfer.confirm.to')} value={recipient} mono />
            <SummaryRow
              label={t('transfer.confirm.amount')}
              value={`${formatBalance(parsed)} ${tokenName}`}
              emphasize
            />
            {tokenName !== 'QU' && (
              <SummaryRow label={t('transfer.confirm.feeLabel')} value="100 QU" />
            )}
          </div>

          <div className="flex items-start gap-2 border-t border-border/40 pt-3 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t('transfer.confirm.warning')}</span>
          </div>
        </div>

        <DrawerFooter>
          <div className="flex flex-col gap-2">
            <Button onClick={onConfirm} size="lg" className="w-full gap-2" disabled={sending}>
              <SendIcon className="h-4 w-4" />
              {sending ? t('transfer.actions.sending') : t('transfer.actions.confirm')}
            </Button>
            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="w-full gap-2"
              disabled={sending}
            >
              <XIcon className="h-4 w-4" />
              {t('transfer.actions.cancel')}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

const TransferForm = ({
  recipient,
  amount,
  errors,
  errorMessage,
  currentIdentity,
  fromAccounts,
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
  onFromAccountChange,
  onSelectVaultRecipient,
  onRecipientChange,
  onAmountChange,
  onTargetTickOffsetChange,
  onManualTargetTickChange,
  onManualTargetTickToggle,
  onContinue,
}: {
  recipient: string
  amount: string
  errors: FormErrors
  errorMessage: string
  currentIdentity: string
  fromAccounts: Array<{ name: string; identity: string; watchOnly?: boolean }>
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
  onFromAccountChange: (identity: string) => void
  onSelectVaultRecipient: (identity: string) => void
  onRecipientChange: (value: string) => void
  onAmountChange: (value: string) => void
  onTargetTickOffsetChange: (value: number) => void
  onManualTargetTickChange: (value: string) => void
  onManualTargetTickToggle: () => void
  quBalance: bigint
  usdEstimate: string
  onContinue: () => void
}) => {
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
            <div className="flex items-center justify-between gap-2">
              <Label>{t('transfer.form.from')}</Label>
              {isWatchOnly && (
                <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('transfer.form.watchOnly')}
                </span>
              )}
            </div>
            <Select value={currentIdentity} onValueChange={onFromAccountChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('transfer.form.fromPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {fromAccounts.map((account) => (
                  <SelectItem
                    key={`${account.identity}-${account.watchOnly ? 'watch' : 'vault'}`}
                    value={account.identity}
                  >
                    {account.name} — {truncateString(account.identity)}{' '}
                    {account.watchOnly ? `(${t('transfer.form.watchOnly')})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              {QUICK_TARGET_TICK_OFFSETS.map((offset) => (
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

const Transfer = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  usePendingTransactionsVersion()
  const [currentIdentity, setCurrentIdentity] = useState(getCurrentIdentity())
  const [isWatchOnly, setIsWatchOnly] = useState(() => isWatchOnlyIdentity(getCurrentIdentity()))
  const [fromAccounts, setFromAccounts] = useState<SourceAccount[]>(() => getSourceAccounts())
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
  const pendingOutgoingDebit = getPendingOutgoingDebit(currentIdentity, currentTick)
  const hasPendingOutgoing =
    getPendingTransactionsForIdentity(currentIdentity, currentTick).length > 0
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

  const handleFromAccountChange = (identity: string) => {
    const selectedFrom = fromAccounts.find((entry) => entry.identity === identity)
    if (!selectedFrom) return

    setCurrentIdentity(identity)
    setIsWatchOnly(Boolean(selectedFrom.watchOnly))
    setErrorMessage('')
    setErrors({})
    if (recipient.trim() === identity) {
      setRecipient('')
    }
    setAmount('')
    setSelectedToken('qu')
    setOnboarded(identity, selectedFrom.name)
  }

  useEffect(() => {
    const refreshAccount = () => {
      const nextIdentity = getCurrentIdentity()
      const nextAccounts = getSourceAccounts()
      setCurrentIdentity(nextIdentity)
      setFromAccounts(nextAccounts)
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
        currentIdentity={currentIdentity}
        fromAccounts={fromAccounts}
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
        onFromAccountChange={handleFromAccountChange}
        onSelectVaultRecipient={handleSelectVaultRecipient}
        onRecipientChange={handleRecipientChange}
        onAmountChange={handleAmountChange}
        onTargetTickOffsetChange={handleTargetTickOffsetChange}
        onManualTargetTickChange={handleManualTargetTickChange}
        onManualTargetTickToggle={handleManualTargetTickToggle}
        quBalance={effectiveQuBalance}
        onContinue={handleContinue}
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
