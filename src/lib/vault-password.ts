import { openBrowserVault } from '@/lib/vault'

export const changeVaultPassphrase = async (
  currentPassphrase: string,
  newPassphrase: string,
): Promise<void> => {
  const vault = await openBrowserVault(currentPassphrase, false)
  await vault.rotatePassphrase(newPassphrase)
  await vault.save()
}
