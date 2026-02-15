import { VAULT_STORAGE_KEY } from '@/lib/vault'

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

export const clearWalletStorage = () => {
  if (typeof localStorage === 'undefined') return

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
