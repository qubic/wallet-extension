import { DAPP_CURRENT_ACCOUNT_KEY } from '@/lib/dapp/storage'

const getChromeStorage = () => {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome
  return chromeApi?.storage?.local ?? null
}

const readCurrentAccount = () => {
  const identity = localStorage.getItem('currentIdentity') ?? ''
  const name = localStorage.getItem('currentAccountName') ?? undefined
  if (!identity) return null
  return { identity, name }
}

const syncCurrentAccount = async () => {
  const storage = getChromeStorage()
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

  void syncCurrentAccount()

  const refresh = () => {
    void syncCurrentAccount()
  }

  window.addEventListener('storage', refresh)
  window.addEventListener('wallet-account-updated', refresh)
}
