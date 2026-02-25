import type { DappRpcResponse } from '@/lib/dapp/protocol'
import {
  dappExecutionRequestSchema,
  dappPendingRequestSchema,
  dappRequestResultSchema,
} from '@/lib/dapp/schemas'

export const DAPP_PERMISSIONS_KEY = 'dapp.permissions.v1'
export const DAPP_CURRENT_ACCOUNT_KEY = 'dapp.currentAccount.v1'
export const DAPP_PENDING_REQUESTS_KEY = 'dapp.pendingRequests.v1'
export const DAPP_EXECUTION_REQUESTS_KEY = 'dapp.executionRequests.v1'
export const DAPP_REQUEST_RESULTS_KEY = 'dapp.requestResults.v1'

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

export type DappExecutionRequest = Readonly<{
  id: string
  method: 'connect' | 'signMessage' | 'signTransaction'
  origin: string
  createdAt: number
  session: string
  state: 'awaitingApproval' | 'executing'
  executionStartedAt?: number
  params?: unknown
  encryptedParams?: unknown
  account?: DappCurrentAccount
}>

export type DappRequestResultRecord = Readonly<{
  id: string
  createdAt: number
  origin: string
  session: string
  state: 'ready'
  response: DappRpcResponse
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
  return raw.filter(
    (entry): entry is DappPendingRequest => dappPendingRequestSchema.safeParse(entry).success,
  )
}

export const setDappPendingRequests = async (requests: DappPendingRequest[]) => {
  const storage = getChromeStorage()
  if (!storage) return
  await storage.set({ [DAPP_PENDING_REQUESTS_KEY]: requests })
}

export const getDappExecutionRequests = async (): Promise<DappExecutionRequest[]> => {
  const storage = getChromeStorage()
  if (!storage) return []
  const result = await storage.get(DAPP_EXECUTION_REQUESTS_KEY)
  const raw = result[DAPP_EXECUTION_REQUESTS_KEY]
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (entry): entry is DappExecutionRequest => dappExecutionRequestSchema.safeParse(entry).success,
  )
}

export const setDappExecutionRequests = async (requests: DappExecutionRequest[]) => {
  const storage = getChromeStorage()
  if (!storage) return
  await storage.set({ [DAPP_EXECUTION_REQUESTS_KEY]: requests })
}

export const upsertDappExecutionRequest = async (request: DappExecutionRequest) => {
  const requests = await getDappExecutionRequests()
  const next = requests.filter((entry) => entry.id !== request.id)
  next.push(request)
  await setDappExecutionRequests(next)
}

export const getDappExecutionRequestById = async (id: string) => {
  const requests = await getDappExecutionRequests()
  return requests.find((entry) => entry.id === id) ?? null
}

export const removeDappExecutionRequest = async (id: string) => {
  const requests = await getDappExecutionRequests()
  const next = requests.filter((entry) => entry.id !== id)
  if (next.length === requests.length) return false
  await setDappExecutionRequests(next)
  return true
}

export const getDappRequestResults = async (): Promise<DappRequestResultRecord[]> => {
  const storage = getChromeStorage()
  if (!storage) return []
  const result = await storage.get(DAPP_REQUEST_RESULTS_KEY)
  const raw = result[DAPP_REQUEST_RESULTS_KEY]
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (entry): entry is DappRequestResultRecord => dappRequestResultSchema.safeParse(entry).success,
  )
}

export const setDappRequestResults = async (results: DappRequestResultRecord[]) => {
  const storage = getChromeStorage()
  if (!storage) return
  await storage.set({ [DAPP_REQUEST_RESULTS_KEY]: results })
}

export const upsertDappRequestResult = async (result: DappRequestResultRecord) => {
  const results = await getDappRequestResults()
  const next = results.filter((entry) => entry.id !== result.id)
  next.push(result)
  await setDappRequestResults(next)
}

export const getDappRequestResultById = async (id: string) => {
  const results = await getDappRequestResults()
  return results.find((entry) => entry.id === id) ?? null
}

export const removeDappRequestResult = async (id: string) => {
  const results = await getDappRequestResults()
  const next = results.filter((entry) => entry.id !== id)
  if (next.length === results.length) return false
  await setDappRequestResults(next)
  return true
}
