import { useEffect, useState } from 'react'
import { ACCOUNT_UPDATED_EVENT, getCachedAccounts, getWatchOnlyAccounts } from '@/lib/accounts'

export type AccountNameEntry = Readonly<{
  name: string
  identity: string
}>

const readAllAccounts = (): AccountNameEntry[] => [
  ...getCachedAccounts(),
  ...getWatchOnlyAccounts(),
]

export const useAccountNames = (): AccountNameEntry[] => {
  const [accounts, setAccounts] = useState<AccountNameEntry[]>(() => readAllAccounts())

  useEffect(() => {
    const refresh = () => setAccounts(readAllAccounts())
    window.addEventListener(ACCOUNT_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(ACCOUNT_UPDATED_EVENT, refresh)
  }, [])

  return accounts
}
