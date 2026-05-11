import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { ChevronDownIcon, ChevronUpIcon, GlobeIcon, Link2OffIcon, LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  DAPP_PENDING_REQUESTS_KEY,
  type DappPendingRequest,
  getDappPendingRequests,
} from '@/lib/dapp/storage'
import { RUNTIME_APPROVAL_DECISION_TYPE } from '@/lib/dapp/protocol'
import {
  getApprovalAccountSummary,
  getApprovalConnectSummary,
  getApprovalMessagePreview,
  getApprovalTxSummary,
} from '@/lib/dapp/approval-preview'
import { getChromeApi } from '@/lib/dapp/chrome-api'
import { PasswordInput } from '@/components/ui/password-input'
import { formatIntegerLike, formatNumber, truncateString } from '@/lib/utils'
import {
  DAPP_APPROVAL_QUERY_PARAM,
  DAPP_APPROVAL_QUERY_VALUE,
  NATIVE_TOKEN_SYMBOL,
} from '@/lib/config/constants'
import AddressLabel from '@/components/address-label'
import { useTxTypeDescription } from '@/hooks/use-tx-type-description'
import { isWalletLocked } from '@/lib/lock'
import { validateVaultPassphrase } from '@/lib/vault'
import { toast } from 'sonner'

const DappApprovalDrawer = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [requests, setRequests] = useState<DappPendingRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [inputBytesExpanded, setInputBytesExpanded] = useState(false)
  const [faviconError, setFaviconError] = useState<string | null>(null)
  const [locked, setLocked] = useState(() => isWalletLocked())
  const isDappApprovalPopup =
    window.location.pathname.endsWith('popup.html') &&
    new URLSearchParams(window.location.search).get(DAPP_APPROVAL_QUERY_PARAM) ===
      DAPP_APPROVAL_QUERY_VALUE

  const loadPendingRequests = useCallback(async () => {
    const next = await getDappPendingRequests()
    setRequests(next.sort((a, b) => a.createdAt - b.createdAt))
  }, [])

  useEffect(() => {
    void loadPendingRequests()
    const chromeApi = getChromeApi()
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return
      if (!changes[DAPP_PENDING_REQUESTS_KEY]) return
      void loadPendingRequests()
    }
    chromeApi?.storage?.onChanged?.addListener(onChanged)
    return () => chromeApi?.storage?.onChanged?.removeListener(onChanged)
  }, [loadPendingRequests])

  useEffect(() => {
    const syncLockState = () => {
      setLocked(isWalletLocked())
    }

    syncLockState()
    window.addEventListener('wallet-lock-updated', syncLockState)
    window.addEventListener('storage', syncLockState)
    return () => {
      window.removeEventListener('wallet-lock-updated', syncLockState)
      window.removeEventListener('storage', syncLockState)
    }
  }, [])

  const current = requests[0] ?? null
  const isOpen = Boolean(current) && !locked && location.pathname !== '/unlock'
  const requiresPassphrase =
    current?.method === 'signMessage' ||
    current?.method === 'signTransaction' ||
    current?.method === 'sendTransaction'
  const messagePreview = useMemo(
    () => getApprovalMessagePreview(current?.params),
    [current?.params],
  )
  const connectSummary = useMemo(
    () => getApprovalConnectSummary(current?.params),
    [current?.params],
  )
  const accountSummary = useMemo(
    () => getApprovalAccountSummary(current?.params),
    [current?.params],
  )
  const txSummary = useMemo(() => getApprovalTxSummary(current?.params), [current?.params])
  const txTypeDescription = useTxTypeDescription(
    txSummary?.toIdentity ?? '',
    Number(txSummary?.inputType ?? 0),
  )
  const isWatchOnlySigningRequest = Boolean(
    current &&
      (current.method === 'signMessage' ||
        current.method === 'signTransaction' ||
        current.method === 'sendTransaction') &&
      accountSummary?.accountWatchOnly,
  )

  const title = useMemo(() => {
    if (!current) return ''
    switch (current.method) {
      case 'connect':
        return t('dapp.approval.connectTitle')
      case 'signMessage':
        return t('dapp.approval.signMessageTitle')
      case 'signTransaction':
        return t('dapp.approval.signTransactionTitle')
      case 'sendTransaction':
        return t('dapp.approval.sendTransactionTitle')
      default:
        return t('dapp.approval.title')
    }
  }, [current, t])

  const subtitle = useMemo(() => {
    if (!current) return ''
    if (isWatchOnlySigningRequest) {
      return t('dapp.approval.watchOnlySubtitle')
    }
    switch (current.method) {
      case 'connect':
        return t('dapp.approval.connectSubtitle')
      case 'signMessage':
        return t('dapp.approval.signMessageSubtitle')
      case 'signTransaction':
        return t('dapp.approval.signTransactionSubtitle')
      case 'sendTransaction':
        return t('dapp.approval.sendTransactionSubtitle')
      default:
        return t('dapp.approval.genericSubtitle')
    }
  }, [current, isWatchOnlySigningRequest, t])

  const faviconUrl = useMemo(() => {
    if (!current?.origin) return null
    try {
      const url = new URL(current.origin)
      return `${url.origin}/favicon.ico`
    } catch {
      return null
    }
  }, [current?.origin])

  const submitDecision = async (approved: boolean) => {
    if (!current) return
    const chromeApi = getChromeApi()
    const runtime = chromeApi?.runtime
    if (!runtime?.sendMessage) {
      setError(t('dapp.approval.errors.runtimeUnavailable'))
      return
    }

    if (approved && requiresPassphrase) {
      if (!passphrase.trim()) {
        setError(t('passphraseAuth.validation.required'))
        return
      }
      const validation = await validateVaultPassphrase(passphrase)
      if (!validation.valid) {
        setError(
          validation.reason === 'invalid'
            ? t('passphraseAuth.errors.invalidPassphrase')
            : t('passphraseAuth.errors.generic'),
        )
        return
      }
    }

    setLoading(true)
    setError('')
    try {
      const result = await new Promise<{
        ok?: boolean
        executed?: boolean
        targetTick?: number
      }>((resolve) => {
        runtime.sendMessage(
          {
            type: RUNTIME_APPROVAL_DECISION_TYPE,
            payload: {
              id: current.id,
              approved,
              passphrase: approved && requiresPassphrase ? passphrase : undefined,
            },
          },
          (response?: { ok?: boolean; executed?: boolean; targetTick?: number }) => {
            resolve(response ?? { ok: false })
          },
        )
      })
      if (!result.ok) {
        setError(t('dapp.approval.errors.decisionFailed'))
        return
      }
      if (approved && current.method === 'sendTransaction') {
        if (result.executed === true) {
          const isSimpleTransfer = txSummary?.inputType === '0' && Number(txSummary?.amount) > 0
          const targetTick =
            result.targetTick && Number.isFinite(result.targetTick)
              ? formatNumber(result.targetTick)
              : undefined
          toast.success(
            isSimpleTransfer ? t('transfer.success.title') : t('dapp.approval.txBroadcastSuccess'),
            targetTick
              ? { description: t('transaction.broadcastDescription', { targetTick }) }
              : undefined,
          )
        } else if (result.executed === false) {
          toast.error(t('transfer.errors.broadcastFailed'))
        }
      }

      setRequests((prev) => prev.filter((request) => request.id !== current.id))
      setPassphrase('')

      if (isDappApprovalPopup && requests.length <= 1) {
        window.close()
      }
    } finally {
      setPassphrase('')
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (nextOpen) return
        if (!current || loading) return
        void submitDecision(false)
      }}
    >
      <DrawerContent
        className={
          isDappApprovalPopup
            ? 'inset-0 h-full max-h-none overflow-hidden rounded-none border-none bg-background data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:rounded-none data-[vaul-drawer-direction=bottom]:border-none'
            : 'max-h-[90vh] overflow-hidden border-none bg-background'
        }
      >
        <DrawerHeader className="shrink-0 space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {faviconUrl && faviconError !== faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="h-6 w-6 shrink-0 rounded-sm"
                onError={() => setFaviconError(faviconUrl)}
              />
            ) : (
              <GlobeIcon className="h-6 w-6 shrink-0 text-primary" />
            )}
          </div>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{subtitle}</DrawerDescription>
        </DrawerHeader>

        {current && (
          <div className="app-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-2">
            <div className="rounded-xl border border-border/60 bg-background/40 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t('dapp.approval.origin')}
              </p>
              <p className="truncate text-sm font-medium text-foreground">{current.origin}</p>
            </div>
            {current.method === 'connect' && connectSummary && (
              <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t('dapp.approval.sharedAccount')}
                </p>
                <p
                  className="truncate text-sm font-medium text-foreground"
                  title={connectSummary.accountName}
                >
                  {connectSummary.accountName || t('dapp.approval.sharedAccountFallback')}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {truncateString(connectSummary.accountIdentity)}
                </p>
              </div>
            )}
            {current.method === 'signMessage' && (
              <div className="space-y-2">
                <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t('dapp.approval.messageLabel')}
                  </p>
                  <p className="break-all text-sm font-medium text-foreground">
                    {messagePreview
                      ? truncateString(messagePreview, { leading: 42, trailing: 18, minLength: 80 })
                      : t('dapp.approval.messageEmpty')}
                  </p>
                </div>
              </div>
            )}
            {(current.method === 'signTransaction' || current.method === 'sendTransaction') &&
              txSummary && (
                <div className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-3">
                  {txSummary.toIdentity && (
                    <p className="text-xs text-muted-foreground" title={txSummary.toIdentity}>
                      <AddressLabel
                        address={txSummary.toIdentity}
                        prefix={`${t('dapp.approval.txTo')}:`}
                        className="text-foreground"
                      />
                    </p>
                  )}
                  {txSummary.amount && (
                    <p className="text-xs text-muted-foreground">
                      {t('dapp.approval.txAmount')}:{' '}
                      <span className="font-mono text-foreground">
                        {formatIntegerLike(txSummary.amount)} {NATIVE_TOKEN_SYMBOL}
                      </span>
                    </p>
                  )}
                  {txSummary.inputType && (
                    <p className="text-xs text-muted-foreground">
                      {t('dapp.approval.txType')}:{' '}
                      <span className="font-mono text-foreground">{txTypeDescription}</span>
                    </p>
                  )}
                  {txSummary.targetTick && Number(txSummary.targetTick) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t('dapp.approval.txTargetTick')}:{' '}
                      <span className="font-mono text-foreground">
                        {formatNumber(Number(txSummary.targetTick))}
                      </span>
                    </p>
                  )}
                  {txSummary.inputBytes && (
                    <div className="text-xs text-muted-foreground">
                      <p>{t('dapp.approval.txInputBytes')}:</p>
                      <p
                        className={`mt-1 break-all rounded bg-muted/50 p-1.5 font-mono text-[11px] text-foreground ${inputBytesExpanded ? 'max-h-40 overflow-y-auto' : 'max-h-10 overflow-hidden'}`}
                      >
                        {txSummary.inputBytes}
                      </p>
                      {txSummary.inputBytes.length > 80 && (
                        <button
                          type="button"
                          className="mt-1 flex items-center gap-0.5 text-primary"
                          onClick={() => setInputBytesExpanded((prev) => !prev)}
                        >
                          {inputBytesExpanded ? (
                            <>
                              {t('dapp.approval.txInputBytesCollapse')}{' '}
                              <ChevronUpIcon className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              {t('dapp.approval.txInputBytesExpand')}{' '}
                              <ChevronDownIcon className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            {isWatchOnlySigningRequest && accountSummary && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-sm font-medium text-foreground">
                  {t('dapp.approval.watchOnlyTitle')}
                </p>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {t('dapp.approval.watchOnlyDescription', {
                    accountName:
                      accountSummary.accountName || t('dapp.approval.sharedAccountFallback'),
                  })}
                </p>
              </div>
            )}
            {requiresPassphrase && !isWatchOnlySigningRequest && (
              <PasswordInput
                id="dapp-passphrase"
                groupClassName="h-12"
                placeholder={t('passphraseAuth.form.passphrasePlaceholder')}
                value={passphrase}
                onChange={(event) => {
                  setPassphrase(event.target.value)
                  if (error) setError('')
                }}
                className="h-12 text-base"
              />
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}

        <DrawerFooter className="shrink-0 border-t border-border/60 bg-background grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => void submitDecision(false)}
            disabled={loading || !current}
            className={`w-full gap-2 ${isWatchOnlySigningRequest ? 'col-span-2' : ''}`}
          >
            <Link2OffIcon className="h-4 w-4" />
            {isWatchOnlySigningRequest
              ? t('dapp.approval.watchOnlyDismiss')
              : t('dapp.approval.reject')}
          </Button>
          {!isWatchOnlySigningRequest && (
            <Button
              onClick={() => void submitDecision(true)}
              disabled={loading || !current}
              className="w-full gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              {current?.method === 'sendTransaction'
                ? t('dapp.approval.approveAndSend')
                : t('dapp.approval.approve')}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default DappApprovalDrawer
