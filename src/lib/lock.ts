const LOCKED_KEY = 'walletLocked'
const LAST_UNLOCK_AT_KEY = 'walletLastUnlockAt'
const LOCK_TIMEOUT_MINUTES_KEY = 'walletLockTimeoutMinutes'
const SESSION_UNLOCKED_KEY = 'walletSessionUnlocked'
export const DEFAULT_LOCK_TIMEOUT_MINUTES = 15
const MIN_LOCK_TIMEOUT_MINUTES = 1
const MAX_LOCK_TIMEOUT_MINUTES = 120

type ChromeStorageSession = {
  get: (keys: string[], callback: (items: Record<string, unknown>) => void) => void
  set: (items: Record<string, unknown>, callback?: () => void) => void
  remove: (keys: string | string[], callback?: () => void) => void
}

const getChromeSessionStorage = (): ChromeStorageSession | null => {
  if (typeof window === 'undefined') return null

  const maybeChrome = (
    window as Window & {
      chrome?: { storage?: { session?: ChromeStorageSession } }
    }
  ).chrome

  return maybeChrome?.storage?.session ?? null
}

const setSessionUnlockedFlag = (value: boolean) => {
  const sessionStorage = getChromeSessionStorage()
  if (!sessionStorage) return

  try {
    if (value) {
      sessionStorage.set({ [SESSION_UNLOCKED_KEY]: true })
      return
    }
    sessionStorage.remove(SESSION_UNLOCKED_KEY)
  } catch {
    // Ignore storage failures.
  }
}

const notifyLockUpdate = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('wallet-lock-updated'))
}

export const getLockTimeoutMinutes = () => {
  try {
    const raw = localStorage.getItem(LOCK_TIMEOUT_MINUTES_KEY)
    if (!raw) return DEFAULT_LOCK_TIMEOUT_MINUTES
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return DEFAULT_LOCK_TIMEOUT_MINUTES
    return Math.min(MAX_LOCK_TIMEOUT_MINUTES, Math.max(MIN_LOCK_TIMEOUT_MINUTES, parsed))
  } catch {
    return DEFAULT_LOCK_TIMEOUT_MINUTES
  }
}

export const setLockTimeoutMinutes = (minutes: number) => {
  const clamped = Math.min(MAX_LOCK_TIMEOUT_MINUTES, Math.max(MIN_LOCK_TIMEOUT_MINUTES, minutes))
  try {
    localStorage.setItem(LOCK_TIMEOUT_MINUTES_KEY, clamped.toString())
  } catch {
    // Ignore storage failures.
  }
  notifyLockUpdate()
}

export const getLockTimeoutMs = () => getLockTimeoutMinutes() * 60 * 1000

export const lockWallet = () => {
  try {
    localStorage.setItem(LOCKED_KEY, 'true')
  } catch {
    // Ignore storage failures.
  }
  setSessionUnlockedFlag(false)
  notifyLockUpdate()
}

export const setUnlocked = () => {
  try {
    localStorage.setItem(LOCKED_KEY, 'false')
    localStorage.setItem(LAST_UNLOCK_AT_KEY, Date.now().toString())
  } catch {
    // Ignore storage failures.
  }
  setSessionUnlockedFlag(true)
  notifyLockUpdate()
}

export const getLastUnlockAt = () => {
  try {
    const raw = localStorage.getItem(LAST_UNLOCK_AT_KEY)
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const ensureUnlockTimestamp = () => {
  try {
    const locked = localStorage.getItem(LOCKED_KEY) === 'true'
    if (locked) return
    const lastUnlockAt = localStorage.getItem(LAST_UNLOCK_AT_KEY)
    if (!lastUnlockAt) {
      setUnlocked()
    }
  } catch {
    // Ignore storage failures.
  }
}

export const isWalletLocked = () => {
  try {
    const locked = localStorage.getItem(LOCKED_KEY) === 'true'
    if (locked) return true
  } catch {
    return true
  }

  const lastUnlockAt = getLastUnlockAt()
  if (!lastUnlockAt) return true
  return Date.now() - lastUnlockAt >= getLockTimeoutMs()
}

const readSessionUnlockedFlag = async () => {
  const sessionStorage = getChromeSessionStorage()
  if (!sessionStorage) return true

  return new Promise<boolean>((resolve) => {
    try {
      sessionStorage.get([SESSION_UNLOCKED_KEY], (items) => {
        resolve(items?.[SESSION_UNLOCKED_KEY] === true)
      })
    } catch {
      resolve(true)
    }
  })
}

export const reconcileLockStateWithBrowserSession = async () => {
  if (isWalletLocked()) return true

  const hasActiveSession = await readSessionUnlockedFlag()
  if (!hasActiveSession) {
    lockWallet()
    return true
  }

  return false
}
