import {
  type SeedVault,
  createLocalStorageVaultStore,
  openSeedVaultBrowser,
  VaultEntryNotFoundError,
  VaultInvalidPassphraseError,
} from '@qubic-labs/sdk'
import { emitAccountUpdated } from '@/lib/accounts'

export const VAULT_STORAGE_KEY = 'qubic.vault'

export const openBrowserVault = async (passphrase: string, create = false) => {
  const store = createLocalStorageVaultStore(VAULT_STORAGE_KEY)
  return openSeedVaultBrowser({ store, passphrase, create })
}

/**
 * Verify that a vault was opened with the correct passphrase by reading the
 * first entry's seed. Uses `vault.list()` so it works regardless of whether
 * the currently-selected account is watch-only.
 */
export const verifyVaultAccess = async (
  vault: SeedVault,
): Promise<{ valid: true } | { valid: false; reason: 'invalid' | 'error' }> => {
  try {
    const expectedIdentity = vault.list()[0]?.identity
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

/**
 * Validate that the passphrase can open the existing vault and access a known entry.
 * Returns `{ valid: true }` on success or `{ valid: false, reason }` on failure.
 */
export const validateVaultPassphrase = async (
  passphrase: string,
): Promise<{ valid: true } | { valid: false; reason: 'invalid' | 'error' }> => {
  try {
    const vault = await openBrowserVault(passphrase, false)
    return verifyVaultAccess(vault)
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
