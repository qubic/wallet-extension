import { getChromeLocalStorage, getChromeSessionStorage } from '@/lib/dapp/chrome-api'
import {
  DAPP_CURRENT_ACCOUNT_KEY,
  DAPP_EXECUTION_REQUESTS_KEY,
  DAPP_PENDING_REQUESTS_KEY,
  DAPP_PERMISSIONS_KEY,
  DAPP_REQUEST_RESULTS_KEY,
} from '@/lib/dapp/storage'
import { PENDING_CHROME_STORAGE_KEY } from '@/lib/pending-transactions-storage'
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
  DAPP_PERMISSIONS_KEY,
  DAPP_CURRENT_ACCOUNT_KEY,
  DAPP_PENDING_REQUESTS_KEY,
  DAPP_EXECUTION_REQUESTS_KEY,
  DAPP_REQUEST_RESULTS_KEY,
  PENDING_CHROME_STORAGE_KEY,
] as const

export const clearWalletStorage = async (): Promise<void> => {
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

  await Promise.all([
    getChromeLocalStorage()?.remove([...CHROME_WALLET_KEYS]),
    getChromeSessionStorage()?.clear(),
  ])
}
