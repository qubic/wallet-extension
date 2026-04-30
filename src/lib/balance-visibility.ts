import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'wallet:balanceVisible'

const getSnapshot = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

let currentValue = getSnapshot()

const listeners = new Set<() => void>()

const notify = () => {
  currentValue = getSnapshot()
  for (const listener of listeners) {
    listener()
  }
}

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) notify()
})

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const snapshot = () => currentValue

export const useBalanceVisibility = () => {
  const isVisible = useSyncExternalStore(subscribe, snapshot)

  const toggle = useCallback(() => {
    const next = !getSnapshot()
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // ignore storage failures
    }
    notify()
  }, [])

  return { isVisible, toggle } as const
}

export const HIDDEN_BALANCE = '******'
