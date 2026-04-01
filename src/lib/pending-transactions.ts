import { useSyncExternalStore } from 'react'
import { QX_TRANSFER_ASSET_INPUT_TYPE } from '@/lib/qx'
import {
  type PendingTransaction,
  type PendingTransactionStatus,
  normalizePendingTransactionHash,
  readPendingTransactionsFromChromeStorage,
  readPendingTransactionsFromLocalStorage,
  subscribePendingChromeStorageChanges,
  writePendingTransactionsToChromeStorage,
  writePendingTransactionsToLocalStorage,
} from '@/lib/pending-transactions-storage'
import { computeTransactionStatus, hasDefinitiveStatus } from '@/lib/transaction-status'
export type {
  PendingTransaction,
  PendingTransactionStatus,
} from '@/lib/pending-transactions-storage'

export const PENDING_SETTLED_EVENT = 'wallet-pending-settled'
const PENDING_SETTLED_REFETCH_DELAY_MS = 2_500

const pendingByHash = new Map<string, PendingTransaction>()
const listeners = new Set<() => void>()
const settledEventTimers = new Map<string, number>()
let pendingVersion = 0

const hasWindow = () => typeof window !== 'undefined'

const schedulePendingSettledEvent = (pending: PendingTransaction) => {
  if (!hasWindow()) return
  const key = normalizePendingTransactionHash(pending.hash)
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

const persistPending = () => {
  writePendingTransactionsToLocalStorage(pendingByHash.values())
  void writePendingTransactionsToChromeStorage(pendingByHash.values())
}

const mergePendingEntries = (items: PendingTransaction[]) => {
  for (const pending of items) {
    const key = normalizePendingTransactionHash(pending.hash)
    const existing = pendingByHash.get(key)
    if (!existing) {
      pendingByHash.set(key, pending)
      continue
    }

    if (pending.createdAt > existing.createdAt) {
      pendingByHash.set(key, pending)
      continue
    }
    if (
      pending.createdAt === existing.createdAt &&
      (pending.status === 'invalid' || pending.status === 'failed')
    ) {
      pendingByHash.set(key, pending)
    }
  }
}

const loadPending = () => {
  mergePendingEntries(readPendingTransactionsFromLocalStorage())
}

const getPendingStateSignature = () =>
  JSON.stringify(
    Array.from(pendingByHash.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, pending]) => [
        key,
        pending.status,
        pending.createdAt,
        pending.targetTick,
        pending.amount?.toString() ?? '',
      ]),
  )

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
void readPendingTransactionsFromChromeStorage().then((items) => {
  if (items.length === 0) return
  const before = getPendingStateSignature()
  mergePendingEntries(items)
  if (before !== getPendingStateSignature()) {
    writePendingTransactionsToLocalStorage(pendingByHash.values())
    notifyPendingChanged()
  }
})
subscribePendingChromeStorageChanges(() => {
  void readPendingTransactionsFromChromeStorage().then((items) => {
    const before = getPendingStateSignature()
    pendingByHash.clear()
    mergePendingEntries(readPendingTransactionsFromLocalStorage())
    mergePendingEntries(items)
    if (before !== getPendingStateSignature()) {
      writePendingTransactionsToLocalStorage(pendingByHash.values())
      notifyPendingChanged()
    }
  })
})

export const addPendingTransaction = (pending: {
  hash: string
  sourceIdentity: string
  destinationIdentity?: string
  amount?: bigint
  inputType?: number
  tokenKey?: string
  targetTick: number
}) => {
  const key = normalizePendingTransactionHash(pending.hash)
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
  const key = normalizePendingTransactionHash(hash)
  if (!key) return
  if (pendingByHash.delete(key)) {
    persistPending()
    notifyPendingChanged()
  }
}

export const getPendingTransaction = (hash: string) => {
  const key = normalizePendingTransactionHash(hash)
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
  const statusOrder: Record<PendingTransactionStatus, number> = {
    pending: 0,
    failed: 1,
    invalid: 2,
  }
  return items.sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    return b.createdAt - a.createdAt
  })
}

export const canResendPendingTransaction = (
  pending: Pick<PendingTransaction, 'status' | 'destinationIdentity' | 'inputType' | 'tokenKey'>,
) => {
  if (pending.status !== 'failed' && pending.status !== 'invalid') return false
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
  transactions: Array<{
    hash: string
    moneyFlew?: boolean
    inputType?: number | bigint
    amount?: number | bigint
    destination?: string
  }>,
  processedTick?: number | bigint,
) => {
  if (pendingByHash.size === 0) return
  let changed = false
  const confirmedByHash = new Map(
    transactions.map((tx) => [normalizePendingTransactionHash(tx.hash), tx]),
  )

  for (const [key, tx] of confirmedByHash) {
    const pending = pendingByHash.get(key)
    if (!pending) continue

    const inputType = Number(tx.inputType ?? pending.inputType ?? 0)
    const amount = tx.amount ?? pending.amount ?? 0
    const moneyFlew = tx.moneyFlew

    // Check if this is a transaction type where moneyFlew is definitive
    if (moneyFlew === false) {
      const status = computeTransactionStatus(inputType, amount, false, tx.destination)
      if (status === 'failure') {
        // On-chain transaction with moneyFlew: false — failed state is derived
        // from moneyFlew when rendering, so remove from pending tracking
        if (pendingByHash.delete(key)) {
          schedulePendingSettledEvent(pending)
          changed = true
        }
        continue
      }
      // Non-definitive types (SC calls) with moneyFlew: false fall through
      // intentionally — we cannot determine success/failure so we treat them
      // as confirmed ("executed") and remove from pending.
    }

    // For definitive types, wait until moneyFlew is resolved
    if (moneyFlew === undefined && hasDefinitiveStatus(inputType, amount, tx.destination)) {
      continue
    }

    // Transaction confirmed (moneyFlew true or non-definitive type)
    if (pendingByHash.delete(key)) {
      schedulePendingSettledEvent(pending)
      changed = true
    }
  }

  const lastProcessedTick = parseProcessedTick(processedTick)
  if (lastProcessedTick != null) {
    for (const [key, pending] of pendingByHash.entries()) {
      if (pending.status !== 'pending') continue
      if (lastProcessedTick > pending.targetTick) {
        // Local-only: transaction was never included in a block
        pendingByHash.set(key, { ...pending, status: 'invalid' })
        changed = true
      }
    }
  }

  if (changed) {
    persistPending()
    notifyPendingChanged()
  }
}
