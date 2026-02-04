const LOCKED_KEY = 'walletLocked'
const LAST_UNLOCK_AT_KEY = 'walletLastUnlockAt'
const LOCK_TIMEOUT_MINUTES_KEY = 'walletLockTimeoutMinutes'
export const DEFAULT_LOCK_TIMEOUT_MINUTES = 10
const MIN_LOCK_TIMEOUT_MINUTES = 1
const MAX_LOCK_TIMEOUT_MINUTES = 120

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
  notifyLockUpdate()
}

export const setUnlocked = () => {
  try {
    localStorage.setItem(LOCKED_KEY, 'false')
    localStorage.setItem(LAST_UNLOCK_AT_KEY, Date.now().toString())
  } catch {
    // Ignore storage failures.
  }
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
