import { k12, publicKeyFromIdentity, verifyMessage as schnorrqVerifyMessage } from '@qubic.ts/core'
import {
  decodeShiftedHex,
  isValidSignatureFormat,
  parseSignedMessage,
} from '@/lib/message-signing/format'
import { isValidIdentity } from '@/lib/utils'

export type VerifyMessageErrorCode = 'parse' | 'identity' | 'signature' | 'checksum' | 'invalid'

export type VerifyMessageResult =
  | { ok: true; identity: string; message: string }
  | { ok: false; error: VerifyMessageErrorCode }

// Inverse of `signMessage`. Interoperates with the Qubic web wallet, .NET Wallet and Toolkit.
export const verifyMessage = async (jsonInput: string): Promise<VerifyMessageResult> => {
  const parsed = parseSignedMessage(jsonInput)
  if (!parsed) return { ok: false, error: 'parse' }

  if (!isValidIdentity(parsed.identity)) {
    return { ok: false, error: 'identity' }
  }

  if (!isValidSignatureFormat(parsed.signature)) {
    return { ok: false, error: 'signature' }
  }

  // Regex above guarantees 130 valid A-P chars, so decode cannot throw and yields exactly 65 bytes.
  const decoded = decodeShiftedHex(parsed.signature)
  const signatureBytes = decoded.slice(0, 64)
  const providedChecksum = decoded[64]
  const expectedChecksum = k12(signatureBytes, 1)[0]
  if (expectedChecksum !== providedChecksum) {
    return { ok: false, error: 'checksum' }
  }

  try {
    const publicKey = publicKeyFromIdentity(parsed.identity)
    const messageBytes = new TextEncoder().encode(parsed.message)
    const result = schnorrqVerifyMessage(publicKey, messageBytes, signatureBytes)
    if (result !== 1) return { ok: false, error: 'invalid' }
    return { ok: true, identity: parsed.identity, message: parsed.message }
  } catch {
    return { ok: false, error: 'invalid' }
  }
}
