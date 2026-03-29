import { publicKeyFromIdentity } from '@qubic-labs/core'
import type { SmartContract, SmartContractProcedure } from './qubic-static.types'

const TRANSFER_SHARE_MANAGEMENT_RIGHTS_IDENTIFIER = 'transfersharemanagementrights'
const REVOKE_ASSET_MANAGEMENT_RIGHTS_IDENTIFIER = 'revokeassetmanagementrights'

export const PROCEDURE_TYPE_TRANSFER = 'transfer' as const
export const PROCEDURE_TYPE_REVOKE = 'revoke' as const
export type ManagementRightsProcedureType =
  | typeof PROCEDURE_TYPE_TRANSFER
  | typeof PROCEDURE_TYPE_REVOKE

type ManagementRightsProcedureResult = {
  procedure: SmartContractProcedure
  type: ManagementRightsProcedureType
}

const findProcedureByIdentifier = (
  contract: SmartContract,
  identifier: string,
): SmartContractProcedure | undefined => {
  return contract.procedures.find((p) => p.sourceIdentifier?.toLowerCase() === identifier)
}

/**
 * Finds any management rights procedure (transfer or revoke) on a contract.
 * Returns the procedure and its type, preferring transfer over revoke.
 */
export const findManagementRightsProcedure = (
  contract: SmartContract,
): ManagementRightsProcedureResult | undefined => {
  const transferProc = findProcedureByIdentifier(
    contract,
    TRANSFER_SHARE_MANAGEMENT_RIGHTS_IDENTIFIER,
  )
  if (transferProc) return { procedure: transferProc, type: PROCEDURE_TYPE_TRANSFER }
  const revokeProc = findProcedureByIdentifier(contract, REVOKE_ASSET_MANAGEMENT_RIGHTS_IDENTIFIER)
  if (revokeProc) return { procedure: revokeProc, type: PROCEDURE_TYPE_REVOKE }
  return undefined
}

/**
 * Checks if a smart contract has any management rights procedure (transfer or revoke).
 * Used to determine if the contract can be a SOURCE.
 */
export const hasManagementRightsProcedure = (contract: SmartContract): boolean => {
  return findManagementRightsProcedure(contract) !== undefined
}

/**
 * Checks if a smart contract can receive transferred share management rights.
 * Used to filter DESTINATION contracts for transfer operations.
 */
export const canReceiveTransferShares = (contract: SmartContract): boolean => {
  return contract.allowTransferShares === true
}

/**
 * Writes the common payload prefix shared by transfer and revoke operations.
 *
 *   [0..31]   issuer public key          (32 bytes)
 *   [32..39]  asset name (UTF-8, padded) ( 8 bytes)
 *   [40..47]  numberOfShares (int64 LE)  ( 8 bytes)
 */
const writeRightsPayloadBase = (
  payload: Uint8Array,
  issuerIdentity: string,
  assetName: string,
  numberOfShares: bigint,
): DataView => {
  payload.set(publicKeyFromIdentity(issuerIdentity), 0)

  const namePadded = new Uint8Array(8)
  namePadded.set(new TextEncoder().encode(assetName).slice(0, 8), 0)
  payload.set(namePadded, 32)

  const view = new DataView(payload.buffer)
  view.setBigInt64(40, numberOfShares, true)
  return view
}

/**
 * Builds the 52-byte payload for a TransferShareManagementRights transaction.
 *
 * Layout (matches C struct TransferShareManagementRights_input):
 *   [0..47]   base (issuer + name + shares)  (48 bytes)
 *   [48..51]  newManagingContractIndex (u32)  ( 4 bytes)
 */
export const buildTransferRightsPayload = (
  issuerIdentity: string,
  assetName: string,
  numberOfShares: bigint,
  newManagingContractIndex: number,
): Uint8Array => {
  const payload = new Uint8Array(52)
  const view = writeRightsPayloadBase(payload, issuerIdentity, assetName, numberOfShares)
  view.setUint32(48, newManagingContractIndex, true)
  return payload
}

/**
 * Builds the 48-byte payload for a RevokeAssetManagementRights transaction.
 *
 * Layout (matches C struct RevokeAssetManagementRights_input):
 *   [0..47]   base (issuer + name + shares)  (48 bytes)
 */
export const buildRevokeRightsPayload = (
  issuerIdentity: string,
  assetName: string,
  numberOfShares: bigint,
): Uint8Array => {
  const payload = new Uint8Array(48)
  writeRightsPayloadBase(payload, issuerIdentity, assetName, numberOfShares)
  return payload
}
