import type {
  DappConnectResult,
  DappDisconnectResult,
  DappEvent,
  DappMethod,
  DappMethodResultMap,
  DappProviderAccount,
  DappSignMessageResult,
  DappSignTransactionResult,
} from '@/lib/dapp/protocol'
type QubicProviderListener = (payload: unknown) => void

type QubicProvider = {
  isQubic: true
  version: string
  request: <TMethod extends DappMethod>(
    method: TMethod,
    params?: unknown,
  ) => Promise<DappMethodResultMap[TMethod]>
  connect: () => Promise<DappConnectResult>
  getAccount: () => Promise<DappProviderAccount | null>
  signTransaction: (tx: unknown) => Promise<DappSignTransactionResult>
  signMessage: (message: unknown) => Promise<DappSignMessageResult>
  disconnect: () => Promise<DappDisconnectResult>
  on: (event: DappEvent, callback: QubicProviderListener) => () => void
  off: (event: DappEvent, callback: QubicProviderListener) => void
}

declare global {
  interface Window {
    qubic?: QubicProvider
  }
}
