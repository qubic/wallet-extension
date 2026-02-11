export type WatchOnlyAccount = {
  name: string
  identity: string
  watchOnly: true
}

export type CachedAccount = {
  name: string
  identity: string
}

const WATCH_ONLY_KEY = 'watchOnlyAccounts'
const ACCOUNT_ORDER_KEY = 'accountOrder'
const ACCOUNT_CACHE_KEY = 'accountCache'
const ACCOUNT_UPDATED_EVENT = 'wallet-account-updated'

const emitAccountUpdated = () => {
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
