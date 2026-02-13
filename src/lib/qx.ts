import { publicKeyFromIdentity } from '@qubic-labs/core'

export const QX_ADDRESS = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID'
export const QX_TRANSFER_ASSET_FEE = 100n
export const QX_TRANSFER_ASSET_INPUT_TYPE = 2

/**
 * Builds the 80-byte payload for a QX asset transfer transaction.
 *
 * Layout (matches C struct TransferAssetOwnershipAndPossession_input):
 *   [0..31]  issuer public key          (32 bytes)
 *   [32..63] newOwnerAndPossessor key   (32 bytes)
 *   [64..71] asset name (UTF-8, padded) ( 8 bytes)
 *   [72..79] numberOfUnits (int64 LE)   ( 8 bytes)
 */
export const buildAssetTransferPayload = (
  issuerIdentity: string,
  destinationIdentity: string,
  assetName: string,
  numberOfUnits: bigint,
): Uint8Array => {
  const payload = new Uint8Array(80)

  const issuerKey = publicKeyFromIdentity(issuerIdentity)
  payload.set(issuerKey, 0)

  const destinationKey = publicKeyFromIdentity(destinationIdentity)
  payload.set(destinationKey, 32)

  const nameBytes = new TextEncoder().encode(assetName)
  const namePadded = new Uint8Array(8)
  namePadded.set(nameBytes.slice(0, 8), 0)
  payload.set(namePadded, 64)

  const view = new DataView(payload.buffer)
  view.setBigInt64(72, numberOfUnits, true)

  return payload
}
