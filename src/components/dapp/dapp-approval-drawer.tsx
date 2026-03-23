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
  getApprovalConnectSummary,
  getApprovalMessagePreview,
  getApprovalTxSummary,
} from '@/lib/dapp/approval-preview'
import { getChromeApi } from '@/lib/dapp/chrome-api'
import { PasswordInput } from '@/components/ui/password-input'
import { truncateString } from '@/lib/utils'
import AddressLabel from '@/components/address-label'
import { useProcedureName } from '@/hooks/use-procedure-name'
import { isWalletLocked } from '@/lib/lock'
import { validateVaultPassphrase } from '@/lib/vault'

const DappApprovalDrawer = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [requests, setRequests] = useState<DappPendingRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [inputBytesExpanded, setInputBytesExpanded] = useState(false)
  const [locked, setLocked] = useState(() => isWalletLocked())
  const isDappApprovalPopup =
    window.location.pathname.endsWith('popup.html') &&
    new URLSearchParams(window.location.search).get('dapp') === '1'

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
  const txSummary = useMemo(() => getApprovalTxSummary(current?.params), [current?.params])
  const procedureName = useProcedureName(
    txSummary?.toIdentity ?? '',
    Number(txSummary?.inputType ?? 0),
  )

  const subtitle = useMemo(() => {
    if (!current) return ''
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
  }, [current, t])

  const submitDecision = async (approved: boolean) => {
    if (!current) return
    const chromeApi = getChromeApi()
    const runtime = chromeApi?.runtime
    if (!runtime?.sendMessage) {
      setError(t('dapp.approval.errors.runtimeUnavailable'))
      return
    }

    const normalizedPassphrase = passphrase.trim()
    if (approved && requiresPassphrase) {
      if (!normalizedPassphrase) {
        setError(t('passphraseAuth.validation.required'))
        return
      }
      const validation = await validateVaultPassphrase(normalizedPassphrase)
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
      const ok = await new Promise<boolean>((resolve) => {
        runtime.sendMessage(
          {
            type: RUNTIME_APPROVAL_DECISION_TYPE,
            payload: {
              id: current.id,
              approved,
              passphrase: approved && requiresPassphrase ? normalizedPassphrase : undefined,
            },
          },
          (response?: { ok?: boolean }) => {
            resolve(Boolean(response?.ok))
          },
        )
      })
      if (!ok) {
        setError(t('dapp.approval.errors.decisionFailed'))
        return
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
            ? 'inset-0 h-full max-h-none rounded-none border-none bg-background data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:rounded-none data-[vaul-drawer-direction=bottom]:border-none'
            : 'border-none bg-background'
        }
      >
        <DrawerHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GlobeIcon className="h-6 w-6 shrink-0 text-primary" />
          </div>
          <DrawerTitle>{t('dapp.approval.title')}</DrawerTitle>
          <DrawerDescription>{subtitle}</DrawerDescription>
        </DrawerHeader>

        {current && (
          <div className="space-y-3 px-4 pb-2">
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
                <p className="truncate text-sm font-medium text-foreground">
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
                      <span className="font-mono text-foreground">{txSummary.amount}</span>
                    </p>
                  )}
                  {txSummary.inputType && (
                    <p className="text-xs text-muted-foreground">
                      {t('dapp.approval.txInputType')}:{' '}
                      <span className="font-mono text-foreground">
                        {procedureName
                          ? `${txSummary.inputType} (${procedureName})`
                          : txSummary.inputType}
                      </span>
                    </p>
                  )}
                  {txSummary.targetTick && (
                    <p className="text-xs text-muted-foreground">
                      {t('dapp.approval.txTargetTick')}:{' '}
                      <span className="font-mono text-foreground">{txSummary.targetTick}</span>
                    </p>
                  )}
                  {txSummary.targetTickOffset && (
                    <p className="text-xs text-muted-foreground">
                      {t('dapp.approval.txTargetTickOffset')}:{' '}
                      <span className="font-mono text-foreground">
                        +{txSummary.targetTickOffset}
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
            {requiresPassphrase && (
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

        <DrawerFooter className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => void submitDecision(false)}
            disabled={loading || !current}
            className="w-full gap-2"
          >
            <Link2OffIcon className="h-4 w-4" />
            {t('dapp.approval.reject')}
          </Button>
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
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default DappApprovalDrawer
