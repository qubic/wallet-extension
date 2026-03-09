import type { QubicProvider } from '@/lib/dapp/provider'

declare global {
  interface Window {
    qubic?: QubicProvider
  }
}
