import type { SeedVault } from '@qubic-labs/sdk'
import { getWatchOnlyAccounts } from './accounts'
import { createVaultFile, type VaultFileAccount } from './vault-file'

/**
 * Builds the vault file for download: every seed held in the vault, followed by the watch-only
 * accounts, which live outside the vault and carry no seed.
 */
export const exportVaultToFile = async (
  vault: SeedVault,
  passphrase: string,
  appVersion: string,
): Promise<Uint8Array> => {
  const accounts: VaultFileAccount[] = []
  const exported = new Set<string>()

  for (const entry of vault.list()) {
    accounts.push({
      alias: entry.name,
      publicId: entry.identity,
      seed: await vault.getSeed(entry.identity),
      isOnlyWatch: false,
    })
    exported.add(entry.identity)
  }

  for (const watchOnly of getWatchOnlyAccounts()) {
    // An identity that is also in the vault is exported once, with its seed.
    if (exported.has(watchOnly.identity)) continue
    accounts.push({
      alias: watchOnly.name,
      publicId: watchOnly.identity,
      seed: '',
      isOnlyWatch: true,
    })
    exported.add(watchOnly.identity)
  }

  return createVaultFile(passphrase, accounts, appVersion)
}
