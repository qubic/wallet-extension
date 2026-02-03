import { SEED_LENGTH } from '@qubic-labs/core'

const SEED_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

export const generateSeed = () => {
  const bytes = new Uint8Array(SEED_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (value) => SEED_ALPHABET[value % SEED_ALPHABET.length]).join('')
}

export const isSeedLike = (seed: string) => {
  if (seed.length !== SEED_LENGTH) {
    return false
  }
  for (const char of seed) {
    if (char < 'a' || char > 'z') {
      return false
    }
  }
  return true
}
