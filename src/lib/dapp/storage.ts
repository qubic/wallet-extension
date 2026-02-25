import type { DappRpcResponse } from '@/lib/dapp/protocol'
import { getChromeLocalStorage } from '@/lib/dapp/chrome-api'
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

const getStorage = () => getChromeLocalStorage()

const getLocalValue = async (key: string): Promise<unknown> => {
  const storage = getStorage()
  if (!storage) return undefined
  const result = await storage.get(key)
  return result[key]
}

const setLocalValue = async (key: string, value: unknown) => {
  const storage = getStorage()
  if (!storage) return
  await storage.set({ [key]: value })
}

const removeLocalValue = async (key: string) => {
  const storage = getStorage()
  if (!storage) return
  await storage.remove(key)
}

const readValidatedArray = async <T>(
  key: string,
  isEntry: (value: unknown) => value is T,
): Promise<T[]> => {
  const raw = await getLocalValue(key)
  if (!Array.isArray(raw)) return []
  return raw.filter(isEntry)
}

const getArrayEntryById = async <T extends { id: string }>(
  getter: () => Promise<T[]>,
  id: string,
): Promise<T | null> => {
  const entries = await getter()
  return entries.find((entry) => entry.id === id) ?? null
}

const upsertArrayEntry = async <T extends { id: string }>(
  getter: () => Promise<T[]>,
  setter: (entries: T[]) => Promise<void>,
  entry: T,
) => {
  const entries = await getter()
  const next = entries.filter((item) => item.id !== entry.id)
  next.push(entry)
  await setter(next)
}

const removeArrayEntryById = async <T extends { id: string }>(
  getter: () => Promise<T[]>,
  setter: (entries: T[]) => Promise<void>,
  id: string,
) => {
  const entries = await getter()
  const next = entries.filter((entry) => entry.id !== id)
  if (next.length === entries.length) return false
  await setter(next)
  return true
}

export const getDappPermissions = async (): Promise<DappPermissionsState> => {
  const raw = await getLocalValue(DAPP_PERMISSIONS_KEY)
  if (!raw || typeof raw !== 'object') return {}
  return raw as DappPermissionsState
}

export const setDappPermissions = async (state: DappPermissionsState) => {
  await setLocalValue(DAPP_PERMISSIONS_KEY, state)
}

export const removeDappPermission = async (origin: string) => {
  const permissions = await getDappPermissions()
  if (!permissions[origin]) return false
  delete permissions[origin]
  await setDappPermissions(permissions)
  return true
}

export const getDappCurrentAccount = async (): Promise<DappCurrentAccount | null> => {
  const raw = await getLocalValue(DAPP_CURRENT_ACCOUNT_KEY)
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as { identity?: unknown; name?: unknown }
  if (typeof entry.identity !== 'string' || !entry.identity) return null
  return {
    identity: entry.identity,
    name: typeof entry.name === 'string' ? entry.name : undefined,
  }
}

export const setDappCurrentAccount = async (account: DappCurrentAccount | null) => {
  if (!account) {
    await removeLocalValue(DAPP_CURRENT_ACCOUNT_KEY)
    return
  }
  await setLocalValue(DAPP_CURRENT_ACCOUNT_KEY, account)
}

export const getDappPendingRequests = async (): Promise<DappPendingRequest[]> => {
  return readValidatedArray(
    DAPP_PENDING_REQUESTS_KEY,
    (entry): entry is DappPendingRequest => dappPendingRequestSchema.safeParse(entry).success,
  )
}

export const setDappPendingRequests = async (requests: DappPendingRequest[]) => {
  await setLocalValue(DAPP_PENDING_REQUESTS_KEY, requests)
}

export const getDappExecutionRequests = async (): Promise<DappExecutionRequest[]> => {
  return readValidatedArray(
    DAPP_EXECUTION_REQUESTS_KEY,
    (entry): entry is DappExecutionRequest => dappExecutionRequestSchema.safeParse(entry).success,
  )
}

export const setDappExecutionRequests = async (requests: DappExecutionRequest[]) => {
  await setLocalValue(DAPP_EXECUTION_REQUESTS_KEY, requests)
}

export const upsertDappExecutionRequest = async (request: DappExecutionRequest) => {
  await upsertArrayEntry(getDappExecutionRequests, setDappExecutionRequests, request)
}

export const getDappExecutionRequestById = async (id: string) => {
  return getArrayEntryById(getDappExecutionRequests, id)
}

export const removeDappExecutionRequest = async (id: string) => {
  return removeArrayEntryById(getDappExecutionRequests, setDappExecutionRequests, id)
}

export const getDappRequestResults = async (): Promise<DappRequestResultRecord[]> => {
  return readValidatedArray(
    DAPP_REQUEST_RESULTS_KEY,
    (entry): entry is DappRequestResultRecord => dappRequestResultSchema.safeParse(entry).success,
  )
}

export const setDappRequestResults = async (results: DappRequestResultRecord[]) => {
  await setLocalValue(DAPP_REQUEST_RESULTS_KEY, results)
}

export const upsertDappRequestResult = async (result: DappRequestResultRecord) => {
  await upsertArrayEntry(getDappRequestResults, setDappRequestResults, result)
}

export const getDappRequestResultById = async (id: string) => {
  return getArrayEntryById(getDappRequestResults, id)
}

export const removeDappRequestResult = async (id: string) => {
  return removeArrayEntryById(getDappRequestResults, setDappRequestResults, id)
}
