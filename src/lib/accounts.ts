export type WatchOnlyAccount = {
  name: string
  identity: string
  watchOnly: true
}

export type CachedAccount = {
  name: string
  identity: string
}

type AccountNameEntry = {
  name: string
  identity: string
}

const WATCH_ONLY_KEY = 'watchOnlyAccounts'
const ACCOUNT_ORDER_KEY = 'accountOrder'
const ACCOUNT_CACHE_KEY = 'accountCache'
export const ACCOUNT_UPDATED_EVENT = 'wallet-account-updated'

export const emitAccountUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ACCOUNT_UPDATED_EVENT))
  }
}

export const getWatchOnlyAccounts = (): WatchOnlyAccount[] => {
  try {
    const raw = localStorage.getItem(WATCH_ONLY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry) =>
        entry &&
        typeof entry.name === 'string' &&
        typeof entry.identity === 'string' &&
        entry.watchOnly === true,
    )
  } catch {
    return []
  }
}

export const saveWatchOnlyAccounts = (accounts: WatchOnlyAccount[]) => {
  try {
    localStorage.setItem(WATCH_ONLY_KEY, JSON.stringify(accounts))
    emitAccountUpdated()
  } catch {
    // Ignore storage failures.
  }
}

export const getCachedAccounts = (): CachedAccount[] => {
  try {
    const raw = localStorage.getItem(ACCOUNT_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry) => entry && typeof entry.name === 'string' && typeof entry.identity === 'string',
    )
  } catch {
    return []
  }
}

export const saveCachedAccounts = (accounts: CachedAccount[]) => {
  try {
    localStorage.setItem(ACCOUNT_CACHE_KEY, JSON.stringify(accounts))
    emitAccountUpdated()
  } catch {
    // Ignore storage failures.
  }
}

export const getAccountOrder = () => {
  try {
    const raw = localStorage.getItem(ACCOUNT_ORDER_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export const saveAccountOrder = (identities: string[]) => {
  try {
    localStorage.setItem(ACCOUNT_ORDER_KEY, JSON.stringify(identities))
    emitAccountUpdated()
  } catch {
    // Ignore storage failures.
  }
}

export const getCurrentIdentity = (): string => localStorage.getItem('currentIdentity') ?? ''

export const isWatchOnlyIdentity = (identity: string): boolean =>
  getWatchOnlyAccounts().some((entry) => entry.identity === identity)

/**
 * Return the current identity only if it belongs to the encrypted vault
 * (i.e. it is not watch-only). Falls back to the first cached vault account.
 */
export const getCurrentVaultIdentity = (): string => {
  const stored = getCurrentIdentity()
  if (stored && !isWatchOnlyIdentity(stored)) return stored
  return getCachedAccounts()[0]?.identity ?? ''
}

type SuggestedNameOptions = {
  enableAutoName: boolean
  prefix: string
  fallbackName: string
}

export const getSuggestedNextAccountName = ({
  enableAutoName,
  prefix,
  fallbackName,
}: SuggestedNameOptions) => {
  if (!enableAutoName) return fallbackName

  const basePrefix = prefix.trim() || 'Account'
  const totalAccounts = getCachedAccounts().length + getWatchOnlyAccounts().length
  return `${basePrefix} ${totalAccounts + 1}`
}

type IsAccountNameTakenOptions = {
  excludeIdentity?: string
  entries?: AccountNameEntry[]
}

export const isAccountNameTaken = (name: string, options: IsAccountNameTakenOptions = {}) => {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return false

  const entries = options.entries ?? [...getCachedAccounts(), ...getWatchOnlyAccounts()]
  return entries.some(
    (entry) =>
      entry.identity !== options.excludeIdentity && entry.name.trim().toLowerCase() === normalized,
  )
}
