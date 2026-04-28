import {
  k12,
  privateKeyFromSeed,
  publicKeyFromSeed,
  signMessage as schnorrqSignMessage,
} from '@qubic.ts/core'
import { buildSignedMessageJson } from '@/lib/message-signing/format'

// Signs raw UTF-8 message bytes (no K12 pre-hash) — distinct from `signMessageFromSeed`
// in `lib/dapp/signing.ts`, which uses the digest-based scheme required by dApps.
export const signMessage = async ({
  seed,
  message,
  identity,
}: {
  seed: string
  message: string
  identity: string
}) => {
  const messageBytes = new TextEncoder().encode(message)

  const [privateKey, publicKey] = await Promise.all([
    privateKeyFromSeed(seed),
    publicKeyFromSeed(seed),
  ])

  const signature = schnorrqSignMessage(privateKey, publicKey, messageBytes)
  const k12Checksum = k12(signature, 1)[0]

  return buildSignedMessageJson({
    identity,
    message,
    signatureBytes: signature,
    k12Checksum,
  })
}
