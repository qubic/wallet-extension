import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { AlertTriangleIcon, GlobeIcon, Link2OffIcon, LinkIcon } from 'lucide-react'
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
  getApprovalMessageWarnings,
  getApprovalTxSummary,
} from '@/lib/dapp/approval-preview'
import { PasswordInput } from '@/components/ui/password-input'
import { truncateString } from '@/lib/utils'
import { isWalletLocked } from '@/lib/lock'

const DappApprovalDrawer = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [requests, setRequests] = useState<DappPendingRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [locked, setLocked] = useState(() => isWalletLocked())

  const loadPendingRequests = useCallback(async () => {
    const next = await getDappPendingRequests()
    setRequests(next.sort((a, b) => a.createdAt - b.createdAt))
  }, [])

  useEffect(() => {
    void loadPendingRequests()
    const chromeApi = (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome
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
    current?.method === 'signMessage' || current?.method === 'signTransaction'
  const messagePreview = useMemo(
    () => getApprovalMessagePreview(current?.params),
    [current?.params],
  )
  const messageWarnings = useMemo(
    () => getApprovalMessageWarnings(current?.params),
    [current?.params],
  )
  const connectSummary = useMemo(
    () => getApprovalConnectSummary(current?.params),
    [current?.params],
  )
  const txSummary = useMemo(() => getApprovalTxSummary(current?.params), [current?.params])

  const subtitle = useMemo(() => {
    if (!current) return ''
    switch (current.method) {
      case 'connect':
        return t('dapp.approval.connectSubtitle')
      case 'signMessage':
        return t('dapp.approval.signMessageSubtitle')
      case 'signTransaction':
        return t('dapp.approval.signTransactionSubtitle')
      default:
        return t('dapp.approval.genericSubtitle')
    }
  }, [current, t])

  const submitDecision = async (approved: boolean) => {
    if (!current) return
    const chromeApi = (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome
    const runtime = chromeApi?.runtime
    if (!runtime?.sendMessage) {
      setError(t('dapp.approval.errors.runtimeUnavailable'))
      return
    }

    if (approved && requiresPassphrase && !passphrase.trim()) {
      setError(t('passphraseAuth.validation.required'))
      return
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
              passphrase: approved && requiresPassphrase ? passphrase : undefined,
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
    } finally {
      setPassphrase('')
      setLoading(false)
    }
  }

  return (
    <Drawer open={isOpen}>
      <DrawerContent className="border-none bg-background">
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
                {messageWarnings.length > 0 && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                    <div className="mb-1 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <p className="text-xs font-semibold">
                        {t('dapp.approval.messageWarningTitle')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {messageWarnings.map((warning) => (
                        <p
                          key={warning}
                          className="text-xs text-amber-800/90 dark:text-amber-200/90"
                        >
                          {t(`dapp.approval.messageWarnings.${warning}`)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {current.method === 'signTransaction' && txSummary && (
              <div className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-3">
                {txSummary.toIdentity && (
                  <p className="text-xs text-muted-foreground">
                    {t('dapp.approval.txTo')}:{' '}
                    <span className="font-mono text-foreground">{txSummary.toIdentity}</span>
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
                    <span className="font-mono text-foreground">{txSummary.inputType}</span>
                  </p>
                )}
                {txSummary.targetTick && (
                  <p className="text-xs text-muted-foreground">
                    {t('dapp.approval.txTargetTick')}:{' '}
                    <span className="font-mono text-foreground">{txSummary.targetTick}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('dapp.approval.txFee')}:{' '}
                  <span className="font-mono text-foreground">
                    {txSummary.fee === '0'
                      ? t('dapp.approval.txFeeNone')
                      : t('dapp.approval.txFeeMayApply')}
                  </span>
                </p>
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
            {t('dapp.approval.approve')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default DappApprovalDrawer
