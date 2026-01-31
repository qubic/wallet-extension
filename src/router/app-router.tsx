import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '../components/app-shell'
import History from '../pages/history'
import Home from '../pages/home'
import ManageAccounts from '../pages/manage-accounts'
import Settings from '../pages/settings'
import Welcome from '../pages/welcome'

const AppRouter = () => {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/accounts" element={<ManageAccounts />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default AppRouter
