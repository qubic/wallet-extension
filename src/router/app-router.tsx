import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from '../components/app-shell'
import History from '../pages/history'
import Home from '../pages/home'
import ManageAccounts from '../pages/manage-accounts'
import CreateWallet from '../pages/onboarding/create-wallet'
import ImportSeed from '../pages/onboarding/import-seed'
import ImportVault from '../pages/onboarding/import-vault'
import Settings from '../pages/settings'
import Welcome from '../pages/welcome'

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

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/home" replace />} />
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
