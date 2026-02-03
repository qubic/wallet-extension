import { createLocalStorageVaultStore, openSeedVaultBrowser } from '@qubic-labs/sdk'

const VAULT_STORAGE_KEY = 'qubic.vault'

export const openBrowserVault = async (passphrase: string, create = false) => {
  const store = createLocalStorageVaultStore(VAULT_STORAGE_KEY)
  return openSeedVaultBrowser({ store, passphrase, create })
}

export const setOnboarded = (identity: string, name?: string) => {
  localStorage.setItem('hasAccount', 'true')
  localStorage.setItem('currentIdentity', identity)
  if (name) {
    localStorage.setItem('currentAccountName', name)
  }
}

export const clearOnboarded = () => {
  localStorage.removeItem('hasAccount')
  localStorage.removeItem('currentIdentity')
}
