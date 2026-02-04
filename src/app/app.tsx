import { QueryClient } from '@tanstack/react-query'
import { createSdk } from '@qubic-labs/sdk'
import { QubicQueryProvider, SdkProvider } from '@qubic-labs/react'
import { HashRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import AppRouter from '../router/app-router'

const queryClient = new QueryClient()
const sdk = createSdk({ baseUrl: 'https://rpc.qubic.org' })

const App = () => {
  return (
    <SdkProvider sdk={sdk}>
      <QubicQueryProvider client={queryClient}>
        <HashRouter>
          <AppRouter />
        </HashRouter>
        <Toaster theme="dark" richColors />
      </QubicQueryProvider>
    </SdkProvider>
  )
}

export default App
