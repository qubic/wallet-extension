export type SignedMessageData = {
  identity: string
  message: string
  signature: string
}

const CODE_UNIT_A = 65

const SIGNATURE_RE = /^[A-Pa-p]{130}$/

export const encodeShiftedHex = (bytes: Uint8Array): string => {
  let result = ''
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(CODE_UNIT_A + (bytes[i] >> 4))
    result += String.fromCharCode(CODE_UNIT_A + (bytes[i] & 0x0f))
  }
  return result
}

export const decodeShiftedHex = (encoded: string): Uint8Array => {
  const upper = encoded.toUpperCase()
  if (upper.length % 2 !== 0) {
    throw new Error('Shifted-hex string must have even length')
  }
  const bytes = new Uint8Array(upper.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const hi = upper.charCodeAt(i * 2) - CODE_UNIT_A
    const lo = upper.charCodeAt(i * 2 + 1) - CODE_UNIT_A
    if (hi < 0 || hi > 15 || lo < 0 || lo > 15) {
      throw new Error(`Invalid shifted-hex character at position ${i * 2}`)
    }
    bytes[i] = (hi << 4) | lo
  }
  return bytes
}

// Cross-compatible with the legacy Qubic web wallet, .NET Wallet and Toolkit:
// 64-byte signature followed by a 1-byte K12 checksum, encoded as 130-char shifted-hex.
export const buildSignedMessageJson = ({
  identity,
  message,
  signatureBytes,
  k12Checksum,
}: {
  identity: string
  message: string
  signatureBytes: Uint8Array
  k12Checksum: number
}): string => {
  if (signatureBytes.length !== 64) {
    throw new Error(`Expected 64-byte signature, got ${signatureBytes.length}`)
  }

  const sigWithChecksum = new Uint8Array(65)
  sigWithChecksum.set(signatureBytes)
  sigWithChecksum[64] = k12Checksum

  const result: SignedMessageData = {
    identity,
    message,
    signature: encodeShiftedHex(sigWithChecksum),
  }

  return JSON.stringify(result, null, 2)
}

export const parseSignedMessage = (jsonString: string): SignedMessageData | null => {
  try {
    const parsed: unknown = JSON.parse(jsonString)
    if (!parsed || typeof parsed !== 'object') return null

    const { identity, message, signature } = parsed as Record<string, unknown>
    if (
      typeof identity !== 'string' ||
      typeof message !== 'string' ||
      typeof signature !== 'string' ||
      !identity ||
      !signature
    ) {
      return null
    }

    return { identity, message, signature }
  } catch {
    return null
  }
}

export const isValidSignatureFormat = (signature: string): boolean => SIGNATURE_RE.test(signature)
