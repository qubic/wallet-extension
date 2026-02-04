import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import AppShell from '../components/app-shell'
import History from '../pages/history'
import Home from '../pages/home'
import ManageAccounts from '../pages/manage-accounts'
import CreateWallet from '../pages/onboarding/create-wallet'
import ImportSeed from '../pages/onboarding/import-seed'
import ImportVault from '../pages/onboarding/import-vault'
import Transfer from '../pages/transfer'
import Settings from '../pages/settings'
import Unlock from '../pages/unlock'
import Welcome from '../pages/welcome'
import {
  ensureUnlockTimestamp,
  getLockTimeoutMs,
  getLastUnlockAt,
  isWalletLocked,
  lockWallet,
} from '../lib/lock'

const hasAccounts = () => {
  try {
    const hasAccount = localStorage.getItem('hasAccount') === 'true'
    const identity = localStorage.getItem('currentIdentity')
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

  const clearLockTimeout = () => {
    if (lockTimeoutRef.current) {
      window.clearTimeout(lockTimeoutRef.current)
      lockTimeoutRef.current = null
    }
  }

  const scheduleLock = () => {
    clearLockTimeout()
    const lastUnlockAt = getLastUnlockAt()
    if (!lastUnlockAt) {
      lockWallet()
      setIsLocked(true)
      return
    }
    const elapsed = Date.now() - lastUnlockAt
    const remaining = getLockTimeoutMs() - elapsed
    if (remaining <= 0) {
      lockWallet()
      setIsLocked(true)
      return
    }
    lockTimeoutRef.current = window.setTimeout(() => {
      lockWallet()
      setIsLocked(true)
    }, remaining)
  }

  useEffect(() => {
    if (!isOnboarded) return undefined
    ensureUnlockTimestamp()
    setIsLocked(isWalletLocked())
    return undefined
  }, [isOnboarded, location.pathname])

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
  }, [isLocked, isOnboarded])

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
  }, [isOnboarded])

  if (!isOnboarded) {
    return (
      <AppShell showNav={false} showHeader={false}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/onboarding/create"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full"
                >
                  <CreateWallet />
                </motion.div>
              }
            />
            <Route
              path="/onboarding/import-seed"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full"
                >
                  <ImportSeed />
                </motion.div>
              }
            />
            <Route
              path="/onboarding/import-vault"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full"
                >
                  <ImportVault />
                </motion.div>
              }
            />
            <Route
              path="*"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full"
                >
                  <Welcome />
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
      </AppShell>
    )
  }

  if (isOnboarded && isLocked && location.pathname !== '/unlock') {
    return <Navigate to="/unlock" replace />
  }

  return (
    <AppShell showNav={!hideChrome} showHeader={!hideChrome}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/unlock"
            element={
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full"
              >
                <Unlock />
              </motion.div>
            }
          />
          <Route
            path="/home"
            element={
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full"
              >
                <Home />
              </motion.div>
            }
          />
          <Route
            path="/history"
            element={
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full"
              >
                <History />
              </motion.div>
            }
          />
          <Route
            path="/transfer"
            element={
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full"
              >
                <Transfer />
              </motion.div>
            }
          />
          <Route
            path="/accounts"
            element={
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full"
              >
                <ManageAccounts />
              </motion.div>
            }
          />
          <Route
            path="/settings"
            element={
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full"
              >
                <Settings />
              </motion.div>
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  )
}

export default AppRouter
