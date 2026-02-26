import { getChromeSessionStorage } from '@/lib/dapp/chrome-api'

const DAPP_SIDEPANEL_PRESENCE_KEY = 'dapp.sidepanelPresence.v1'
const DAPP_SIDEPANEL_HEARTBEAT_MS = 2_000
const DAPP_SIDEPANEL_FRESH_MS = 5_000

const setPresence = async (updatedAt: number | null) => {
  const sessionStorage = getChromeSessionStorage()
  if (!sessionStorage) return

  try {
    if (updatedAt == null) {
      await sessionStorage.remove(DAPP_SIDEPANEL_PRESENCE_KEY)
      return
    }
    await sessionStorage.set({ [DAPP_SIDEPANEL_PRESENCE_KEY]: { updatedAt } })
  } catch {
    // best-effort only
  }
}

export const isSidepanelPresenceFresh = async () => {
  const sessionStorage = getChromeSessionStorage()
  if (!sessionStorage) return false

  try {
    const raw = await sessionStorage.get(DAPP_SIDEPANEL_PRESENCE_KEY)
    const value = raw[DAPP_SIDEPANEL_PRESENCE_KEY]
    if (!value || typeof value !== 'object') return false
    const updatedAt = (value as { updatedAt?: unknown }).updatedAt
    if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) return false
    return Date.now() - updatedAt <= DAPP_SIDEPANEL_FRESH_MS
  } catch {
    return false
  }
}

export const startDappSidepanelPresenceHeartbeat = () => {
  if (typeof window === 'undefined') return () => {}

  void setPresence(Date.now())
  const intervalId = window.setInterval(() => {
    void setPresence(Date.now())
  }, DAPP_SIDEPANEL_HEARTBEAT_MS)

  const clear = () => {
    window.clearInterval(intervalId)
    void setPresence(null)
  }

  window.addEventListener('pagehide', clear)
  window.addEventListener('beforeunload', clear)

  return () => {
    window.removeEventListener('pagehide', clear)
    window.removeEventListener('beforeunload', clear)
    clear()
  }
}
