import { qUtilGetBalances16 } from '@qubic.org/contracts'
import { identityToPublicKey } from '@qubic.org/crypto'
import { createLiveClient } from '@qubic.org/rpc'
import { QUBIC_RPC_BASE_URL } from '@/lib/config/constants'

// @qubic.org/rpc's createLiveClient POSTs to `/querySmartContract` relative to its
// baseUrl, and does NOT append `/live/v1` itself (unlike @qubic-labs/sdk). So we pass
// the full live base here. The result equals the package default and the Angular
// wallet's mainnet base — guaranteeing identical values.
const live = createLiveClient({ baseUrl: `${QUBIC_RPC_BASE_URL}/live/v1` })

// @qubic.org/crypto types identity as a branded string; cast to a plain-string
// signature (the same cast the Angular wallet uses).
const idToPk = identityToPublicKey as (id: string) => Uint8Array

/**
 * On-chain QU balance for one identity via the QUTIL GetBalances16 procedure, using
 * the generated qUtilGetBalances16 helper (single-key call). Mirrors the Angular
 * wallet's QubicRpcService.getBalances.
 */
export const fetchQutilBalanceValue = async (identity: string): Promise<bigint> => {
  const result = await qUtilGetBalances16(
    live,
    { publicKeys: [identity] },
    { identityToPublicKey: idToPk },
  )
  if (!result.ok) throw result.error
  return result.value.balances[0] ?? 0n
}
