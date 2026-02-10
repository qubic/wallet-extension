import type { SeedVault } from '@qubic-labs/sdk'
// @ts-ignore - No type definitions available for this library
import { QubicVault } from '@qubic-lib/qubic-ts-vault-library/dist/vault.js'
import { getWatchOnlyAccounts } from './accounts'

export async function exportVaultToWebWalletFormat(
  vault: SeedVault,
  password: string
): Promise<any> {
  const qubicVault = new QubicVault()
  await qubicVault.createNewKeys()

  const entries = vault.list()
  const watchOnlyIds = new Set(getWatchOnlyAccounts().map(acc => acc.identity))

  for (const entry of entries) {
    const seed = await vault.getSeed(entry.identity)
    await qubicVault.addSeed({
      alias: entry.name,
      seed,
      publicId: entry.identity,
      isOnlyWatch: watchOnlyIds.has(entry.identity)
    })
  }

  // exportVault returns base64, decode to JSON object
  const base64Vault = await qubicVault.exportVault(password)
  const vaultJson = new TextDecoder().decode(Uint8Array.from(atob(base64Vault), c => c.charCodeAt(0)))
  return JSON.parse(vaultJson)
}
