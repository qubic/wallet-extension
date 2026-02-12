import { openBrowserVault } from '@/lib/vault'


export const changeVaultPassphrase = async (
  currentPassphrase: string,
  newPassphrase: string,
): Promise<void> => {
  const trimmedCurrent = currentPassphrase.trim()
  const trimmedNew = newPassphrase.trim()
  const vault = await openBrowserVault(trimmedCurrent, false)
  await vault.rotatePassphrase(trimmedNew)
  await vault.save()
}
