import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '../components/app-shell'
import History from '../pages/history'
import Home from '../pages/home'
import ManageAccounts from '../pages/manage-accounts'
import Settings from '../pages/settings'
import Welcome from '../pages/welcome'

const hasAccounts = () => {
  try {
    return localStorage.getItem('hasAccount') === 'true'
  } catch {
    return false
  }
}

const AppRouter = () => {
  const isOnboarded = hasAccounts()

  if (!isOnboarded) {
    return (
      <AppShell showNav={false}>
        <Routes>
          <Route path="*" element={<Welcome />} />
        </Routes>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/accounts" element={<ManageAccounts />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AppShell>
  )
}

export default AppRouter
