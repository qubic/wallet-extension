import {
  type SeedVault,
  type VaultSummary,
  type VaultStore,
  createLocalStorageVaultStore,
  openSeedVaultBrowser,
  VaultEntryExistsError,
  VaultEntryNotFoundError,
  VaultInvalidPassphraseError,
} from '@qubic-labs/sdk'
import { emitAccountUpdated } from '@/lib/accounts'
import { getChromeLocalStorage } from '@/lib/dapp/chrome-api'

export const VAULT_STORAGE_KEY = 'qubic.vault'

export const CHROME_VAULT_STORAGE_KEY = `${VAULT_STORAGE_KEY}:chrome`

const getChromeLocalStorageArea = () => getChromeLocalStorage()

const getSafeLocalStorage = () => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

const createChromeVaultStore = (key: string): VaultStore | null => {
  const storage = getChromeLocalStorageArea()
  if (!storage) return null

  return {
    label: key,
    async read() {
      const result = await storage.get(key)
      const value = result[key]
      return typeof value === 'string' ? value : null
    },
    async write(value) {
      await storage.set({ [key]: value })
    },
    async remove() {
      await storage.remove(key)
    },
  }
}

const createHybridVaultStore = (localKey: string, chromeKey: string): VaultStore => {
  const local = getSafeLocalStorage()
  const chromeStore = createChromeVaultStore(chromeKey)
  const localStore = local ? createLocalStorageVaultStore(localKey, local) : null

  if (!chromeStore && !localStore) {
    throw new Error('No supported vault storage is available')
  }

  return {
    label: chromeStore?.label ?? localStore?.label ?? localKey,
    async read() {
      const chromeValue = chromeStore ? await chromeStore.read() : null
      if (chromeValue) return chromeValue

      const localValue = localStore ? await localStore.read() : null
      if (localValue && chromeStore) {
        await chromeStore.write(localValue)
      }
      return localValue
    },
    async write(value) {
      await Promise.all([chromeStore?.write(value), localStore?.write(value)])
    },
    async remove() {
      await Promise.all([chromeStore?.remove?.(), localStore?.remove?.()])
    },
  }
}

const createExtensionVaultStore = () =>
  createHybridVaultStore(VAULT_STORAGE_KEY, CHROME_VAULT_STORAGE_KEY)

export const openBrowserVault = async (passphrase: string, create = false) => {
  const store = createExtensionVaultStore()
  return openSeedVaultBrowser({ store, passphrase, create })
}

export const syncVaultStorageMirror = async () => {
  const store = createExtensionVaultStore()
  void (await store.read())
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

type VaultAccountEntry = {
  name: string
  identity: string
}

const toTimestamp = (value: string): number => {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY
}

const compareVaultEntries = (
  left: VaultSummary & { index: number },
  right: VaultSummary & { index: number },
) => {
  const updatedDiff = toTimestamp(left.updatedAt) - toTimestamp(right.updatedAt)
  if (updatedDiff !== 0) return updatedDiff

  const createdDiff = toTimestamp(left.createdAt) - toTimestamp(right.createdAt)
  if (createdDiff !== 0) return createdDiff

  return left.index - right.index
}

const mapVaultAccounts = (entries: readonly VaultSummary[]): VaultAccountEntry[] =>
  entries.map((entry) => ({ name: entry.name, identity: entry.identity }))

export const repairDuplicateVaultEntries = async (
  vault: SeedVault,
): Promise<VaultAccountEntry[]> => {
  const indexedEntries = vault.list().map((entry, index) => ({ ...entry, index }))
  const entriesByIdentity = new Map<string, Array<VaultSummary & { index: number }>>()

  for (const entry of indexedEntries) {
    const existing = entriesByIdentity.get(entry.identity)
    if (existing) {
      existing.push(entry)
    } else {
      entriesByIdentity.set(entry.identity, [entry])
    }
  }

  const duplicateEntriesToRemove: VaultSummary[] = []
  for (const entries of entriesByIdentity.values()) {
    if (entries.length <= 1) continue
    let keeper = entries[0]
    for (const entry of entries.slice(1)) {
      if (compareVaultEntries(entry, keeper) > 0) {
        keeper = entry
      }
    }
    duplicateEntriesToRemove.push(...entries.filter((entry) => entry.name !== keeper.name))
  }

  if (duplicateEntriesToRemove.length === 0) {
    return mapVaultAccounts(vault.list())
  }

  for (const entry of duplicateEntriesToRemove) {
    await vault.remove(entry.name)
  }
  await vault.save()

  return mapVaultAccounts(vault.list())
}

export const renameVaultAccountByIdentity = async (
  vault: SeedVault,
  identity: string,
  nextName: string,
): Promise<VaultAccountEntry[]> => {
  const normalizedName = nextName.trim()
  const entries = vault.list()
  const currentEntry = entries.find((entry) => entry.identity === identity)
  if (!currentEntry) {
    throw new VaultEntryNotFoundError(identity)
  }

  const conflictingEntry = entries.find((entry) => entry.name === normalizedName)
  if (conflictingEntry && conflictingEntry.identity !== identity) {
    throw new VaultEntryExistsError(normalizedName)
  }

  if (currentEntry.name === normalizedName) {
    return repairDuplicateVaultEntries(vault)
  }

  const seed = await vault.getSeed(identity)
  await vault.remove(currentEntry.name)
  await vault.addSeed({ name: normalizedName, seed, overwrite: false })
  await vault.save()

  return repairDuplicateVaultEntries(vault)
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
