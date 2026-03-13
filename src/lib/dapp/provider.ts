import type {
  DappConnectResult,
  DappDisconnectResult,
  DappEvent,
  DappMethod,
  DappMethodResultMap,
  DappProviderAccount,
  DappSendTransactionResult,
  DappSignMessageResult,
  DappSignTransactionResult,
} from '@/lib/dapp/protocol'

export type ProviderEventCallback = (payload: unknown) => void

export type QubicProvider = {
  isQubic: true
  version: string
  request: <TMethod extends DappMethod>(
    method: TMethod,
    params?: unknown,
  ) => Promise<DappMethodResultMap[TMethod]>
  connect: () => Promise<DappConnectResult>
  getAccount: () => Promise<DappProviderAccount | null>
  signTransaction: (tx: unknown) => Promise<DappSignTransactionResult>
  sendTransaction: (tx: unknown) => Promise<DappSendTransactionResult>
  signMessage: (message: unknown) => Promise<DappSignMessageResult>
  disconnect: () => Promise<DappDisconnectResult>
  on: (event: DappEvent, callback: ProviderEventCallback) => () => void
  off: (event: DappEvent, callback: ProviderEventCallback) => void
}
