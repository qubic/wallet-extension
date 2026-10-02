import { VaultManager } from '@qubic.org/vault'

/** Legacy JSON vault `{salt, iv, cipher}` (PBKDF2 + RSA-wrapped seeds). */
export const VAULT_FILE_VERSION_LEGACY = 1
/** Binary Argon2id vault, shared with the web and mobile wallets. */
export const VAULT_FILE_VERSION_V3 = 3

/** A spendable Qubic seed: 55 lowercase letters. */
const SEED_PATTERN = /^[a-z]{55}$/

/**
 * One account inside a vault file, whether read from or written to it.
 * `seed` is an empty string for watch-only accounts.
 */
export type VaultFileAccount = {
  alias: string
  publicId: string
  seed: string
  isOnlyWatch: boolean
}

export type VaultFileErrorCode =
  /** Not a vault file, or a vault that does not carry the seeds it should. */
  | 'invalid-file'
  /** The file looks like a vault but could not be decrypted with this password. */
  | 'unlock-failed'
  /** A spendable account was handed to the writer without a valid seed. */
  | 'missing-seed'

/**
 * The only error this module throws. Callers branch on `code`, so the library's own error
 * classes and messages never reach the UI.
 */
export class VaultFileError extends Error {
  readonly code: VaultFileErrorCode

  constructor(code: VaultFileErrorCode) {
    super(code)
    this.name = 'VaultFileError'
    this.code = code
  }
}

/** Returns 1 or 3, or `null` when the bytes are not a vault file. Does not decrypt. */
export const getVaultFileVersion = (data: Uint8Array): number | null => {
  try {
    const version = new VaultManager().getVersion(data)
    return version === VAULT_FILE_VERSION_LEGACY || version === VAULT_FILE_VERSION_V3
      ? version
      : null
  } catch {
    return null
  }
}

/**
 * True when a decrypted vault lacks the seed material it should contain.
 *
 * Do not remove: `@qubic.org/vault@1.2.0` returned v1 accounts without decrypting their
 * seeds, and this guard is what keeps such a vault from being imported as a set of unusable
 * accounts. An empty list counts as missing for the same reason.
 */
const isMissingSeedMaterial = (accounts: VaultFileAccount[]) =>
  accounts.length === 0 ||
  accounts.some((account) => !account.isOnlyWatch && account.seed.length === 0)

/**
 * Decrypts a v1 or v3 vault file and returns its accounts.
 *
 * @throws {VaultFileError} `invalid-file` or `unlock-failed`
 */
export const readVaultFile = async (
  data: Uint8Array,
  passphrase: string,
): Promise<VaultFileAccount[]> => {
  if (getVaultFileVersion(data) === null) {
    throw new VaultFileError('invalid-file')
  }

  const manager = new VaultManager()
  let payload: Awaited<ReturnType<VaultManager['unlock']>>
  try {
    payload = await manager.unlock(data, passphrase)
  } catch {
    throw new VaultFileError('unlock-failed')
  }

  try {
    const decoder = new TextDecoder()
    const accounts = (payload.seeds ?? []).map((entry) => {
      const isOnlyWatch = entry.isOnlyWatch === true
      const raw = entry.encryptedSeed
      // The watch-only flag is authoritative. Shape-check the decoded seed too: TextDecoder
      // turns invalid bytes into U+FFFD rather than throwing, so without this, garbage would
      // reach the wallet as a spendable account.
      const decoded = !isOnlyWatch && raw && raw.length > 0 ? decoder.decode(raw) : ''
      return {
        alias: entry.alias ?? '',
        publicId: entry.publicId,
        seed: SEED_PATTERN.test(decoded) ? decoded : '',
        isOnlyWatch,
      }
    })

    if (isMissingSeedMaterial(accounts)) {
      throw new VaultFileError('invalid-file')
    }
    return accounts
  } finally {
    manager.zeroize(payload)
  }
}

/**
 * Writes a v3 (Argon2id) vault file containing the given accounts.
 *
 * The watch-only flag is authoritative: such an account is written without seed material even
 * if a seed was supplied. A spendable account must carry a valid seed, otherwise the export is
 * refused rather than producing a backup that cannot restore that account.
 *
 * @throws {VaultFileError} `missing-seed`
 */
export const createVaultFile = async (
  passphrase: string,
  accounts: VaultFileAccount[],
  appVersion: string,
): Promise<Uint8Array> => {
  if (accounts.some((account) => !account.isOnlyWatch && !SEED_PATTERN.test(account.seed))) {
    throw new VaultFileError('missing-seed')
  }

  const encoder = new TextEncoder()
  const now = new Date().toISOString()

  return new VaultManager().create(
    {
      seeds: accounts.map((account) => ({
        publicId: account.publicId,
        alias: account.alias,
        taintStatus: 0,
        isOnlyWatch: account.isOnlyWatch,
        ...(account.isOnlyWatch ? {} : { encryptedSeed: encoder.encode(account.seed) }),
      })),
      metadata: {
        createdAt: now,
        updatedAt: now,
        appVersion,
        schemaVersion: 3,
      },
    },
    passphrase,
  )
}
