import { getChromeLocalStorage } from '@/lib/dapp/chrome-api'
import { CHROME_VAULT_STORAGE_KEY, VAULT_STORAGE_KEY } from '@/lib/vault'

const EXPLICIT_WALLET_KEYS = [
  VAULT_STORAGE_KEY,
  'hasAccount',
  'currentIdentity',
  'currentAccountName',
  'watchOnlyAccounts',
  'accountOrder',
  'accountCache',
  'walletLocked',
  'walletLastUnlockAt',
  'walletLockTimeoutMinutes',
] as const

const WALLET_KEY_PREFIXES = ['wallet:balance:', 'wallet:pending-transactions:'] as const
const CHROME_WALLET_KEYS = [
  CHROME_VAULT_STORAGE_KEY,
  'dapp.permissions.v1',
  'dapp.currentAccount.v1',
  'dapp.pendingRequests.v1',
  'dapp.executionRequests.v1',
  'dapp.requestResults.v1',
] as const

export const clearWalletStorage = () => {
  if (typeof localStorage !== 'undefined') {
    for (const key of EXPLICIT_WALLET_KEYS) {
      localStorage.removeItem(key)
    }

    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (!key) continue
      if (WALLET_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key)
      }
    }
  }

  void getChromeLocalStorage()?.remove([...CHROME_WALLET_KEYS])
}
