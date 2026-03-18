import { publicKeyFromIdentity } from '@qubic-labs/core'
import type { SmartContract, SmartContractProcedure } from './qubic-static.types'

const TRANSFER_SHARE_MANAGEMENT_RIGHTS_PROCEDURE = 'Transfer Share Management Rights'

/**
 * Checks if a smart contract has the "Transfer Share Management Rights" procedure.
 * Used to determine if the contract can be a SOURCE.
 */
export const hasTransferRightsProcedure = (contract: SmartContract): boolean => {
  return contract.procedures.some(
    (p) => p.name.toLowerCase() === TRANSFER_SHARE_MANAGEMENT_RIGHTS_PROCEDURE.toLowerCase(),
  )
}

/**
 * Checks if a smart contract can receive transferred share management rights.
 * Used to filter DESTINATION contracts.
 */
export const canReceiveTransferShares = (contract: SmartContract): boolean => {
  return contract.allowTransferShares === true
}

/**
 * Finds the "Transfer Share Management Rights" procedure on a contract.
 */
export const findTransferRightsProcedure = (
  contract: SmartContract,
): SmartContractProcedure | undefined => {
  return contract.procedures.find(
    (p) => p.name.toLowerCase() === TRANSFER_SHARE_MANAGEMENT_RIGHTS_PROCEDURE.toLowerCase(),
  )
}

/**
 * Builds the 52-byte payload for a Transfer Share Management Rights transaction.
 *
 * Layout (matches C struct TransferShareManagementRights_input):
 *   [0..31]   issuer public key              (32 bytes)
 *   [32..39]  asset name (UTF-8, padded)     ( 8 bytes)
 *   [40..47]  numberOfShares (int64 LE)      ( 8 bytes)
 *   [48..51]  newManagingContractIndex (u32)  ( 4 bytes)
 */
export const buildTransferRightsPayload = (
  issuerIdentity: string,
  assetName: string,
  numberOfShares: bigint,
  newManagingContractIndex: number,
): Uint8Array => {
  const payload = new Uint8Array(52)

  const issuerKey = publicKeyFromIdentity(issuerIdentity)
  payload.set(issuerKey, 0)

  const nameBytes = new TextEncoder().encode(assetName)
  const namePadded = new Uint8Array(8)
  namePadded.set(nameBytes.slice(0, 8), 0)
  payload.set(namePadded, 32)

  const view = new DataView(payload.buffer)
  view.setBigInt64(40, numberOfShares, true)
  view.setUint32(48, newManagingContractIndex, true)

  return payload
}
