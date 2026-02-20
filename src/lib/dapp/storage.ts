export const DAPP_PERMISSIONS_KEY = 'dapp.permissions.v1'
export const DAPP_CURRENT_ACCOUNT_KEY = 'dapp.currentAccount.v1'
export const DAPP_PENDING_REQUESTS_KEY = 'dapp.pendingRequests.v1'

export type DappPermissionRecord = Readonly<{
  origin: string
  connectedAt: number
}>

export type DappPermissionsState = Record<string, DappPermissionRecord>

export type DappCurrentAccount = Readonly<{
  identity: string
  name?: string
}>

export type DappPendingRequest = Readonly<{
  id: string
  method: 'connect' | 'signMessage' | 'signTransaction'
  origin: string
  createdAt: number
  params?: unknown
}>

const getChromeStorage = () => {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome
  return chromeApi?.storage?.local ?? null
}

export const getDappPermissions = async (): Promise<DappPermissionsState> => {
  const storage = getChromeStorage()
  if (!storage) return {}
  const result = await storage.get(DAPP_PERMISSIONS_KEY)
  const raw = result[DAPP_PERMISSIONS_KEY]
  if (!raw || typeof raw !== 'object') return {}
  return raw as DappPermissionsState
}

export const setDappPermissions = async (state: DappPermissionsState) => {
  const storage = getChromeStorage()
  if (!storage) return
  await storage.set({ [DAPP_PERMISSIONS_KEY]: state })
}

export const removeDappPermission = async (origin: string) => {
  const permissions = await getDappPermissions()
  if (!permissions[origin]) return false
  delete permissions[origin]
  await setDappPermissions(permissions)
  return true
}

export const getDappCurrentAccount = async (): Promise<DappCurrentAccount | null> => {
  const storage = getChromeStorage()
  if (!storage) return null
  const result = await storage.get(DAPP_CURRENT_ACCOUNT_KEY)
  const raw = result[DAPP_CURRENT_ACCOUNT_KEY]
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as { identity?: unknown; name?: unknown }
  if (typeof entry.identity !== 'string' || !entry.identity) return null
  return {
    identity: entry.identity,
    name: typeof entry.name === 'string' ? entry.name : undefined,
  }
}

export const setDappCurrentAccount = async (account: DappCurrentAccount | null) => {
  const storage = getChromeStorage()
  if (!storage) return
  if (!account) {
    await storage.remove(DAPP_CURRENT_ACCOUNT_KEY)
    return
  }
  await storage.set({ [DAPP_CURRENT_ACCOUNT_KEY]: account })
}

export const getDappPendingRequests = async (): Promise<DappPendingRequest[]> => {
  const storage = getChromeStorage()
  if (!storage) return []
  const result = await storage.get(DAPP_PENDING_REQUESTS_KEY)
  const raw = result[DAPP_PENDING_REQUESTS_KEY]
  if (!Array.isArray(raw)) return []
  return raw.filter((entry): entry is DappPendingRequest => {
    if (!entry || typeof entry !== 'object') return false
    const record = entry as Record<string, unknown>
    return (
      typeof record.id === 'string' &&
      Boolean(record.id) &&
      typeof record.origin === 'string' &&
      Boolean(record.origin) &&
      typeof record.createdAt === 'number' &&
      (record.method === 'connect' ||
        record.method === 'signMessage' ||
        record.method === 'signTransaction')
    )
  })
}

export const setDappPendingRequests = async (requests: DappPendingRequest[]) => {
  const storage = getChromeStorage()
  if (!storage) return
  await storage.set({ [DAPP_PENDING_REQUESTS_KEY]: requests })
}
