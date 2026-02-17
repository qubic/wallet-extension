import { useSyncExternalStore } from 'react'
import { QX_TRANSFER_ASSET_INPUT_TYPE } from '@/lib/qx'

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

const PENDING_STORAGE_KEY = 'wallet:pending-transactions:v1'
export const PENDING_SETTLED_EVENT = 'wallet-pending-settled'
const PENDING_SETTLED_REFETCH_DELAY_MS = 2_500

const pendingByHash = new Map<string, PendingTransaction>()
const listeners = new Set<() => void>()
const settledEventTimers = new Map<string, number>()
let pendingVersion = 0

const normalizeHash = (hash: string) => hash.trim().toLowerCase()
const hasStorage = () => typeof localStorage !== 'undefined'
const hasWindow = () => typeof window !== 'undefined'

const schedulePendingSettledEvent = (pending: PendingTransaction) => {
  if (!hasWindow()) return
  const key = normalizeHash(pending.hash)
  const existing = settledEventTimers.get(key)
  if (existing) {
    window.clearTimeout(existing)
  }

  const timeoutId = window.setTimeout(() => {
    settledEventTimers.delete(key)
    window.dispatchEvent(
      new CustomEvent(PENDING_SETTLED_EVENT, {
        detail: {
          hash: pending.hash,
          sourceIdentity: pending.sourceIdentity,
          targetTick: pending.targetTick,
        },
      }),
    )
  }, PENDING_SETTLED_REFETCH_DELAY_MS)

  settledEventTimers.set(key, timeoutId)
}

const toSerialized = (pending: PendingTransaction): SerializedPendingTransaction => ({
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

const fromSerialized = (value: unknown): PendingTransaction | null => {
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

const persistPending = () => {
  if (!hasStorage()) return
  try {
    const payload = Array.from(pendingByHash.values()).map(toSerialized)
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore persistence failures
  }
}

const loadPending = () => {
  if (!hasStorage()) return
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return
    for (const item of parsed) {
      const pending = fromSerialized(item)
      if (!pending) continue
      pendingByHash.set(normalizeHash(pending.hash), pending)
    }
  } catch {
    // ignore malformed persisted state
  }
}

const notify = () => {
  listeners.forEach((listener) => {
    listener()
  })
}

const notifyPendingChanged = () => {
  pendingVersion += 1
  notify()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => pendingVersion

export const usePendingTransactionsVersion = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

loadPending()

export const addPendingTransaction = (pending: {
  hash: string
  sourceIdentity: string
  destinationIdentity?: string
  amount?: bigint
  inputType?: number
  tokenKey?: string
  targetTick: number
}) => {
  const key = normalizeHash(pending.hash)
  if (!key) return
  pendingByHash.set(key, {
    ...pending,
    hash: pending.hash,
    createdAt: Date.now(),
    status: 'pending',
  })
  persistPending()
  notifyPendingChanged()
}

export const removePendingTransaction = (hash: string) => {
  const key = normalizeHash(hash)
  if (!key) return
  if (pendingByHash.delete(key)) {
    persistPending()
    notifyPendingChanged()
  }
}

export const isTransactionPending = (hash: string) => {
  const key = normalizeHash(hash)
  if (!key) return false
  const pending = pendingByHash.get(key)
  return Boolean(pending && pending.status === 'pending')
}

export const isTransactionFailed = (hash: string) => {
  const key = normalizeHash(hash)
  if (!key) return false
  const pending = pendingByHash.get(key)
  return Boolean(pending && pending.status === 'failed')
}

export const getPendingTransaction = (hash: string) => {
  const key = normalizeHash(hash)
  if (!key) return null
  return pendingByHash.get(key) ?? null
}

export const getPendingTransactionsForIdentity = (identity: string) => {
  if (!identity) return []
  const items: PendingTransaction[] = []
  for (const pending of pendingByHash.values()) {
    if (pending.sourceIdentity !== identity) continue
    items.push(pending)
  }
  return items.sort((a, b) => {
    if (a.status === b.status) return b.createdAt - a.createdAt
    return a.status === 'pending' ? -1 : 1
  })
}

export const canResendPendingTransaction = (
  pending: Pick<PendingTransaction, 'status' | 'destinationIdentity' | 'inputType' | 'tokenKey'>,
) => {
  if (pending.status !== 'failed') return false
  if (!pending.destinationIdentity) return false
  if (pending.inputType === 0 || pending.inputType === undefined) return true
  if (pending.inputType === QX_TRANSFER_ASSET_INPUT_TYPE) {
    return Boolean(pending.tokenKey)
  }
  return false
}

export const getArchiverProcessedTick = (
  pages: Array<{ validForTick?: bigint }> | undefined,
): bigint | undefined => {
  if (!pages || pages.length === 0) return undefined
  return pages.reduce<bigint | undefined>((max, page) => {
    if (typeof page.validForTick !== 'bigint') return max
    if (max === undefined || page.validForTick > max) return page.validForTick
    return max
  }, undefined)
}

const parseProcessedTick = (value?: number | bigint | null) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'bigint') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export const resolvePendingTransactions = (
  transactions: Array<{ hash: string }>,
  processedTick?: number | bigint,
) => {
  if (pendingByHash.size === 0) return
  let changed = false
  const confirmedHashes = new Set(transactions.map((tx) => normalizeHash(tx.hash)))

  for (const key of confirmedHashes) {
    if (pendingByHash.has(key)) {
      const settled = pendingByHash.get(key)
      if (settled && pendingByHash.delete(key)) {
        schedulePendingSettledEvent(settled)
        changed = true
      }
    }
  }

  const lastProcessedTick = parseProcessedTick(processedTick)
  if (lastProcessedTick != null) {
    for (const [key, pending] of pendingByHash.entries()) {
      if (pending.status !== 'pending') continue
      if (lastProcessedTick > pending.targetTick) {
        pendingByHash.set(key, { ...pending, status: 'failed' })
        changed = true
      }
    }
  }

  if (changed) {
    persistPending()
    notifyPendingChanged()
  }
}
