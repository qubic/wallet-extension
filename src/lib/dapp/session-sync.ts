import { getChromeLocalStorage } from '@/lib/dapp/chrome-api'
import { DAPP_CURRENT_ACCOUNT_KEY } from '@/lib/dapp/storage'

let dappSessionSyncStarted = false

const readCurrentAccount = () => {
  const identity = localStorage.getItem('currentIdentity') ?? ''
  const name = localStorage.getItem('currentAccountName') ?? undefined
  if (!identity) return null
  return { identity, name }
}

const syncCurrentAccount = async () => {
  const storage = getChromeLocalStorage()
  if (!storage) return
  const account = readCurrentAccount()
  if (!account) {
    await storage.remove(DAPP_CURRENT_ACCOUNT_KEY)
    return
  }
  await storage.set({ [DAPP_CURRENT_ACCOUNT_KEY]: account })
}

export const startDappSessionSync = () => {
  if (typeof window === 'undefined') return
  if (typeof localStorage === 'undefined') return
  if (dappSessionSyncStarted) return
  dappSessionSyncStarted = true

  void syncCurrentAccount()

  const refresh = () => {
    void syncCurrentAccount()
  }

  window.addEventListener('storage', refresh)
  window.addEventListener('wallet-account-updated', refresh)
}
