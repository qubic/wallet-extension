import { getChromeApi, getChromeLocalStorage } from '@/lib/dapp/chrome-api'

export type PendingTransactionStatus = 'pending' | 'failed'

export type PendingTransaction = {
  hash: string
  sourceIdentity: string
  destinationIdentity?: string
  amount?: bigint
  inputType?: number
  tokenKey?: string
  targetTick: number
  createdAt: number
  status: PendingTransactionStatus
}

type SerializedPendingTransaction = {
  hash: string
  sourceIdentity: string
  destinationIdentity?: string
  amount?: string
  inputType?: number
  tokenKey?: string
  targetTick: number
  createdAt: number
  status?: PendingTransactionStatus
}

export const PENDING_STORAGE_KEY = 'wallet:pending-transactions:v1'
export const PENDING_CHROME_STORAGE_KEY = 'wallet:pending-transactions:chrome:v1'

export const normalizePendingTransactionHash = (hash: string) => hash.trim().toLowerCase()

const hasLocalStorage = () => typeof localStorage !== 'undefined'

export const toSerializedPendingTransaction = (
  pending: PendingTransaction,
): SerializedPendingTransaction => ({
  hash: pending.hash,
  sourceIdentity: pending.sourceIdentity,
  destinationIdentity: pending.destinationIdentity,
  amount: pending.amount?.toString(),
  inputType: pending.inputType,
  tokenKey: pending.tokenKey,
  targetTick: pending.targetTick,
  createdAt: pending.createdAt,
  status: pending.status,
})

export const fromSerializedPendingTransaction = (value: unknown): PendingTransaction | null => {
  if (!value || typeof value !== 'object') return null
  const data = value as Partial<SerializedPendingTransaction>
  if (!data.hash || !data.sourceIdentity) return null
  if (typeof data.targetTick !== 'number' || !Number.isFinite(data.targetTick)) return null

  try {
    return {
      hash: data.hash,
      sourceIdentity: data.sourceIdentity,
      destinationIdentity: data.destinationIdentity,
      amount: data.amount ? BigInt(data.amount) : undefined,
      inputType: data.inputType,
      tokenKey: data.tokenKey,
      targetTick: data.targetTick,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      status: data.status === 'failed' ? 'failed' : 'pending',
    }
  } catch {
    return null
  }
}

const parsePendingTransactions = (raw: unknown): PendingTransaction[] => {
  if (!Array.isArray(raw)) return []
  const items: PendingTransaction[] = []
  for (const item of raw) {
    const pending = fromSerializedPendingTransaction(item)
    if (pending) items.push(pending)
  }
  return items
}

export const readPendingTransactionsFromLocalStorage = (): PendingTransaction[] => {
  if (!hasLocalStorage()) return []
  try {
    return parsePendingTransactions(JSON.parse(localStorage.getItem(PENDING_STORAGE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

export const writePendingTransactionsToLocalStorage = (items: Iterable<PendingTransaction>) => {
  if (!hasLocalStorage()) return
  try {
    localStorage.setItem(
      PENDING_STORAGE_KEY,
      JSON.stringify(Array.from(items, toSerializedPendingTransaction)),
    )
  } catch {
    // ignore persistence failures
  }
}

export const readPendingTransactionsFromChromeStorage = async (): Promise<PendingTransaction[]> => {
  const chromeStorage = getChromeLocalStorage()
  if (!chromeStorage) return []

  try {
    const raw = await chromeStorage.get(PENDING_CHROME_STORAGE_KEY)
    return parsePendingTransactions(raw[PENDING_CHROME_STORAGE_KEY])
  } catch {
    return []
  }
}

export const writePendingTransactionsToChromeStorage = async (
  items: Iterable<PendingTransaction>,
): Promise<void> => {
  const chromeStorage = getChromeLocalStorage()
  if (!chromeStorage) return

  try {
    await chromeStorage.set({
      [PENDING_CHROME_STORAGE_KEY]: Array.from(items, toSerializedPendingTransaction),
    })
  } catch {
    // ignore persistence failures
  }
}

export const upsertPendingTransactionInChromeStorage = async (pending: PendingTransaction) => {
  const items = await readPendingTransactionsFromChromeStorage()
  const next = new Map<string, PendingTransaction>()
  for (const item of items) {
    next.set(normalizePendingTransactionHash(item.hash), item)
  }
  next.set(normalizePendingTransactionHash(pending.hash), pending)
  await writePendingTransactionsToChromeStorage(next.values())
}

export const subscribePendingChromeStorageChanges = (listener: () => void) => {
  const chromeApi = getChromeApi()
  const onChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName !== 'local') return
    if (!changes[PENDING_CHROME_STORAGE_KEY]) return
    listener()
  }

  chromeApi?.storage?.onChanged?.addListener(onChanged)
  return () => chromeApi?.storage?.onChanged?.removeListener(onChanged)
}
