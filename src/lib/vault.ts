import {
  createLocalStorageVaultStore,
  openSeedVaultBrowser,
  VaultEntryNotFoundError,
  VaultInvalidPassphraseError,
} from '@qubic-labs/sdk'
import { emitAccountUpdated, getCachedAccounts } from '@/lib/accounts'

const VAULT_STORAGE_KEY = 'qubic.vault'

export const openBrowserVault = async (passphrase: string, create = false) => {
  const store = createLocalStorageVaultStore(VAULT_STORAGE_KEY)
  return openSeedVaultBrowser({ store, passphrase, create })
}

/**
 * Validate that the passphrase can open the existing vault and access a known entry.
 * Returns `{ valid: true }` on success or `{ valid: false, reason }` on failure.
 */
export const validateVaultPassphrase = async (
  passphrase: string,
): Promise<{ valid: true } | { valid: false; reason: 'invalid' | 'error' }> => {
  try {
    const vault = await openBrowserVault(passphrase, false)
    const cached = getCachedAccounts()
    const currentIdentity = localStorage.getItem('currentIdentity')
    const expectedIdentity = currentIdentity ?? cached[0]?.identity
    if (expectedIdentity) {
      await vault.getSeed(expectedIdentity)
    }
    return { valid: true }
  } catch (error) {
    if (error instanceof VaultInvalidPassphraseError || error instanceof VaultEntryNotFoundError) {
      return { valid: false, reason: 'invalid' }
    }
    return { valid: false, reason: 'error' }
  }
}

export const setOnboarded = (identity: string, name?: string) => {
  localStorage.setItem('hasAccount', 'true')
  localStorage.setItem('currentIdentity', identity)
  if (name) {
    localStorage.setItem('currentAccountName', name)
  }
  emitAccountUpdated()
}

export const clearOnboarded = () => {
  localStorage.removeItem('hasAccount')
  localStorage.removeItem('currentIdentity')
  emitAccountUpdated()
}
