import { useEffect, useState } from 'react'
import { ACCOUNT_UPDATED_EVENT, getCurrentIdentity } from '@/lib/accounts'

export const useCurrentIdentity = (onRefresh?: (identity: string) => void) => {
  const [currentIdentity, setCurrentIdentity] = useState(getCurrentIdentity)

  useEffect(() => {
    const refresh = () => {
      const nextIdentity = getCurrentIdentity()
      setCurrentIdentity(nextIdentity)
      onRefresh?.(nextIdentity)
    }

    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener(ACCOUNT_UPDATED_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(ACCOUNT_UPDATED_EVENT, refresh)
    }
  }, [onRefresh])

  return currentIdentity
}
