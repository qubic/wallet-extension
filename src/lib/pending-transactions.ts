import { useSyncExternalStore } from 'react'

type PendingTransaction = {
  hash: string
  sourceIdentity: string
  destinationIdentity?: string
  amount?: bigint
  quImpact?: bigint
  inputType?: number
  targetTick: number
  createdAt: number
}

type SerializedPendingTransaction = {
  hash: string
  sourceIdentity: string
  destinationIdentity?: string
  amount?: string
  quImpact?: string
  inputType?: number
  targetTick: number
  createdAt: number
}

const PENDING_STORAGE_KEY = 'wallet:pending-transactions:v1'
export const PENDING_SETTLED_EVENT = 'wallet-pending-settled'
const PENDING_SETTLED_REFETCH_DELAY_MS = 2_500

const pendingByHash = new Map<string, PendingTransaction>()
const listeners = new Set<() => void>()
const settledEventTimers = new Map<string, number>()

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
  quImpact: pending.quImpact?.toString(),
  inputType: pending.inputType,
  targetTick: pending.targetTick,
  createdAt: pending.createdAt,
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
      quImpact: data.quImpact ? BigInt(data.quImpact) : undefined,
      inputType: data.inputType,
      targetTick: data.targetTick,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
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

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => pendingByHash.size

export const usePendingTransactionsVersion = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

loadPending()

export const addPendingTransaction = (pending: {
  hash: string
  sourceIdentity: string
  destinationIdentity?: string
  amount?: bigint
  quImpact?: bigint
  inputType?: number
  targetTick: number
}) => {
  const key = normalizeHash(pending.hash)
  if (!key) return
  pendingByHash.set(key, {
    ...pending,
    hash: pending.hash,
    createdAt: Date.now(),
  })
  persistPending()
  notify()
}

export const removePendingTransaction = (hash: string) => {
  const key = normalizeHash(hash)
  if (!key) return
  if (pendingByHash.delete(key)) {
    persistPending()
    notify()
  }
}

export const isTransactionPending = (hash: string, currentTick?: number) => {
  const key = normalizeHash(hash)
  if (!key) return false
  const pending = pendingByHash.get(key)
  if (!pending) return false

  const isTickReached =
    typeof currentTick === 'number' &&
    Number.isFinite(currentTick) &&
    Number.isFinite(pending.targetTick) &&
    currentTick >= pending.targetTick

  if (isTickReached) {
    if (pendingByHash.delete(key)) {
      schedulePendingSettledEvent(pending)
      persistPending()
      notify()
    }
    return false
  }

  return true
}

export const getPendingTransaction = (hash: string, currentTick?: number) => {
  if (!isTransactionPending(hash, currentTick)) return null
  return pendingByHash.get(normalizeHash(hash)) ?? null
}

export const getPendingTransactionsForIdentity = (identity: string, currentTick?: number) => {
  if (!identity) return []
  const items: PendingTransaction[] = []
  for (const pending of pendingByHash.values()) {
    if (pending.sourceIdentity !== identity) continue
    if (!isTransactionPending(pending.hash, currentTick)) continue
    items.push(pending)
  }
  return items.sort((a, b) => b.createdAt - a.createdAt)
}

export const getPendingOutgoingDebit = (identity: string, currentTick?: number) => {
  const pending = getPendingTransactionsForIdentity(identity, currentTick)
  return pending.reduce((sum, tx) => {
    const debit = tx.quImpact ?? tx.amount ?? 0n
    return sum + (debit > 0n ? debit : 0n)
  }, 0n)
}

export const resolvePendingTransactions = (
  transactions: Array<{ hash: string }>,
  currentTick?: number,
) => {
  if (pendingByHash.size === 0) return
  let changed = false

  for (const tx of transactions) {
    const key = normalizeHash(tx.hash)
    if (pendingByHash.has(key)) {
      pendingByHash.delete(key)
      changed = true
    }
  }

  if (typeof currentTick === 'number' && Number.isFinite(currentTick)) {
    for (const [key, pending] of pendingByHash.entries()) {
      if (currentTick >= pending.targetTick) {
        pendingByHash.delete(key)
        schedulePendingSettledEvent(pending)
        changed = true
      }
    }
  }

  if (changed) {
    persistPending()
    notify()
  }
}
