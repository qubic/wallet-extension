import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import AnimatedRoute from '../components/animated-route'
import AppShell from '../components/app-shell'
import History from '../pages/history'
import Home from '../pages/home'
import ManageAccounts from '../pages/manage-accounts'
import CreateWallet from '../pages/onboarding/create-wallet'
import ImportSeed from '../pages/onboarding/import-seed'
import ImportVault from '../pages/onboarding/import-vault'
import Transfer from '../pages/transfer'
import Settings from '../pages/settings'
import General from '../pages/settings/general'
import Security from '../pages/settings/security'
import TransactionDetails from '../pages/transaction-details'
import Unlock from '../pages/unlock'
import Welcome from '../pages/welcome'
import ImportWatchOnly from '../pages/accounts/import-watch-only'
import {
  ensureUnlockTimestamp,
  getLockTimeoutMs,
  getLastUnlockAt,
  isWalletLocked,
  lockWallet,
  reconcileLockStateWithBrowserSession,
  touchWalletActivity,
} from '../lib/lock'
import { getCurrentIdentity } from '../lib/accounts'

const hasAccounts = () => {
  try {
    const hasAccount = localStorage.getItem('hasAccount') === 'true'
    const identity = getCurrentIdentity()
    return hasAccount && Boolean(identity)
  } catch {
    return false
  }
}

const AppRouter = () => {
  const location = useLocation()
  const isOnboarded = hasAccounts()
  const [isLocked, setIsLocked] = useState(() => isWalletLocked())
  const lockTimeoutRef = useRef<number | null>(null)
  const hideChrome = location.pathname === '/unlock'
  const routeKey = `${location.pathname}${location.search}`

  const clearLockTimeout = useCallback(() => {
    if (lockTimeoutRef.current) {
      window.clearTimeout(lockTimeoutRef.current)
      lockTimeoutRef.current = null
    }
  }, [])

  const scheduleLock = useCallback(() => {
    clearLockTimeout()
    const lockTimeoutMs = getLockTimeoutMs()
    if (lockTimeoutMs <= 0) {
      return
    }
    const lastUnlockAt = getLastUnlockAt()
    if (!lastUnlockAt) {
      lockWallet()
      setIsLocked(true)
      return
    }
    const elapsed = Date.now() - lastUnlockAt
    const remaining = lockTimeoutMs - elapsed
    if (remaining <= 0) {
      lockWallet()
      setIsLocked(true)
      return
    }
    lockTimeoutRef.current = window.setTimeout(() => {
      lockWallet()
      setIsLocked(true)
    }, remaining)
  }, [clearLockTimeout])

  useEffect(() => {
    if (!isOnboarded) return undefined
    let isDisposed = false

    const syncLockState = async () => {
      ensureUnlockTimestamp()
      await reconcileLockStateWithBrowserSession()
      if (isDisposed) return
      setIsLocked(isWalletLocked())
    }

    void syncLockState()

    return () => {
      isDisposed = true
    }
  }, [isOnboarded])

  useEffect(() => {
    if (!isOnboarded) return undefined
    if (isLocked) {
      clearLockTimeout()
      return undefined
    }
    scheduleLock()
    return () => {
      clearLockTimeout()
    }
  }, [clearLockTimeout, isLocked, isOnboarded, scheduleLock])

  useEffect(() => {
    if (!isOnboarded) return undefined
    if (isLocked) return undefined

    const recordActivity = () => {
      touchWalletActivity()
      scheduleLock()
    }

    const lockOnClose = () => {
      if (getLockTimeoutMs() <= 0) {
        lockWallet()
      }
    }

    window.addEventListener('pointerdown', recordActivity, { passive: true })
    window.addEventListener('keydown', recordActivity, { passive: true })
    window.addEventListener('touchstart', recordActivity, { passive: true })
    window.addEventListener('beforeunload', lockOnClose)
    window.addEventListener('pagehide', lockOnClose)

    return () => {
      window.removeEventListener('pointerdown', recordActivity)
      window.removeEventListener('keydown', recordActivity)
      window.removeEventListener('touchstart', recordActivity)
      window.removeEventListener('beforeunload', lockOnClose)
      window.removeEventListener('pagehide', lockOnClose)
    }
  }, [isLocked, isOnboarded, scheduleLock])

  useEffect(() => {
    if (!isOnboarded) return undefined
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return
      if (
        event.key === 'walletLocked' ||
        event.key === 'walletLastUnlockAt' ||
        event.key === 'walletLockTimeoutMinutes'
      ) {
        setIsLocked(isWalletLocked())
        if (event.key === 'walletLockTimeoutMinutes') {
          scheduleLock()
        }
      }
    }
    const handleLockUpdate = () => {
      setIsLocked(isWalletLocked())
      scheduleLock()
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('wallet-lock-updated', handleLockUpdate)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('wallet-lock-updated', handleLockUpdate)
    }
  }, [isOnboarded, scheduleLock])

  if (!isOnboarded) {
    return (
      <AppShell showNav={false} showHeader={false}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={routeKey}>
            <Route
              path="/onboarding/create"
              element={
                <AnimatedRoute>
                  <CreateWallet />
                </AnimatedRoute>
              }
            />
            <Route
              path="/onboarding/import-seed"
              element={
                <AnimatedRoute>
                  <ImportSeed />
                </AnimatedRoute>
              }
            />
            <Route
              path="/onboarding/import-vault"
              element={
                <AnimatedRoute>
                  <ImportVault />
                </AnimatedRoute>
              }
            />
            <Route
              path="*"
              element={
                <AnimatedRoute>
                  <Welcome />
                </AnimatedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </AppShell>
    )
  }

  if (isLocked && location.pathname !== '/unlock') {
    return <Navigate to="/unlock" replace />
  }

  return (
    <AppShell showNav={!hideChrome} showHeader={!hideChrome}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={routeKey}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/unlock"
            element={
              <AnimatedRoute>
                <Unlock />
              </AnimatedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <AnimatedRoute>
                <Home />
              </AnimatedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <AnimatedRoute>
                <History />
              </AnimatedRoute>
            }
          />
          <Route
            path="/tx/:hash"
            element={
              <AnimatedRoute>
                <TransactionDetails />
              </AnimatedRoute>
            }
          />
          <Route
            path="/transfer"
            element={
              <AnimatedRoute>
                <Transfer />
              </AnimatedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <AnimatedRoute>
                <ManageAccounts />
              </AnimatedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AnimatedRoute>
                <Settings />
              </AnimatedRoute>
            }
          />
          <Route
            path="/settings/general"
            element={
              <AnimatedRoute>
                <General />
              </AnimatedRoute>
            }
          />
          <Route
            path="/settings/security"
            element={
              <AnimatedRoute>
                <Security />
              </AnimatedRoute>
            }
          />
          <Route
            path="/onboarding/create"
            element={
              <AnimatedRoute>
                <CreateWallet
                  variant="add-address"
                  onCancelPath="/accounts"
                  onCompletePath="/accounts"
                />
              </AnimatedRoute>
            }
          />
          <Route
            path="/onboarding/import-seed"
            element={
              <AnimatedRoute>
                <ImportSeed />
              </AnimatedRoute>
            }
          />
          <Route
            path="/accounts/create"
            element={
              <AnimatedRoute>
                <CreateWallet
                  variant="add-address"
                  onCancelPath="/accounts"
                  onCompletePath="/accounts"
                />
              </AnimatedRoute>
            }
          />
          <Route
            path="/accounts/import-seed"
            element={
              <AnimatedRoute>
                <ImportSeed
                  variant="add-address"
                  onCancelPath="/accounts"
                  onCompletePath="/accounts"
                />
              </AnimatedRoute>
            }
          />
          <Route
            path="/accounts/watch-only"
            element={
              <AnimatedRoute>
                <ImportWatchOnly />
              </AnimatedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  )
}

export default AppRouter
