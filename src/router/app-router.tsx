import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '../components/app-shell'
import Home from '../pages/home'
import Settings from '../pages/settings'

const AppRouter = () => {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default AppRouter
