const MIN_PASSPHRASE_LENGTH = 12

export type PassphraseStrengthResult =
  | { valid: true }
  | { valid: false; reason: 'required' | 'tooShort' }

export const validatePassphraseStrength = (
  passphrase: string,
  options: { requireMinLength?: boolean } = {},
): PassphraseStrengthResult => {
  const trimmed = passphrase.trim()
  if (!trimmed) return { valid: false, reason: 'required' }
  const requireMinLength = options.requireMinLength ?? true
  if (requireMinLength && trimmed.length < MIN_PASSPHRASE_LENGTH) {
    return { valid: false, reason: 'tooShort' }
  }
  return { valid: true }
}
