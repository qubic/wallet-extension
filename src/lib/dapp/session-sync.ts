import { isWatchOnlyIdentity } from '@/lib/accounts'
import { getChromeLocalStorage } from '@/lib/dapp/chrome-api'
import { DAPP_CURRENT_ACCOUNT_KEY } from '@/lib/dapp/storage'

let dappSessionSyncStarted = false

const readCurrentAccount = () => {
  // Intentionally mirrors the currently selected account from UI state (including watch-only).
  // dApp connect/events should reflect the active account, while signing is rejected later
  // in the controller if the active account does not exist in the encrypted vault.
  const identity = localStorage.getItem('currentIdentity') ?? ''
  const name = localStorage.getItem('currentAccountName') ?? undefined
  if (!identity) return null
  return {
    identity,
    name,
    watchOnly: isWatchOnlyIdentity(identity) ? true : undefined,
  }
}

export const syncDappCurrentAccountSnapshotFromLocalState = async () => {
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

  void syncDappCurrentAccountSnapshotFromLocalState()

  const refresh = () => {
    void syncDappCurrentAccountSnapshotFromLocalState()
  }

  window.addEventListener('storage', refresh)
  window.addEventListener('wallet-account-updated', refresh)
}
