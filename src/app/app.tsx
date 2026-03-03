import { QueryClient } from '@tanstack/react-query'
import { createSdk } from '@qubic-labs/sdk'
import { QubicQueryProvider, SdkProvider } from '@qubic-labs/react'
import { HashRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import AppRouter from '../router/app-router'
import { QUBIC_RPC_BASE_URL } from '@/lib/config/constants'

const queryClient = new QueryClient()
const sdk = createSdk({ baseUrl: QUBIC_RPC_BASE_URL })

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="theme">
      <SdkProvider sdk={sdk}>
        <QubicQueryProvider client={queryClient}>
          <HashRouter>
            <AppRouter />
          </HashRouter>
          <Toaster richColors position="top-center" duration={2000} />
        </QubicQueryProvider>
      </SdkProvider>
    </ThemeProvider>
  )
}

export default App
