import { qUtilGetBalances16 } from '@qubic.org/contracts'
import { identityToPublicKey } from '@qubic.org/crypto'
import { createLiveClient } from '@qubic.org/rpc'
import { QUBIC_RPC_BASE_URL } from '@/lib/config/constants'

// The @qubic.org/rpc live client appends only `/querySmartContract` to its baseUrl, so the
// base must already include `/live/v1`. We derive it from QUBIC_RPC_BASE_URL so the endpoint
// follows the configured network (this equals the package default for mainnet).
const live = createLiveClient({ baseUrl: `${QUBIC_RPC_BASE_URL}/live/v1` })

// @qubic.org/crypto types identity as a branded string; cast to a plain-string signature
// (the same cast the Angular wallet uses).
const idToPk = identityToPublicKey as (id: string) => Uint8Array

/**
 * Shared query key for an identity's QU balance. All readers must use this so they share a
 * single react-query cache entry per identity.
 */
export const qutilBalanceQueryKey = (identity: string) => ['qubic', 'balance', identity]

/**
 * On-chain QU balance (raw value) for one identity via the QUTIL GetBalances16 procedure
 * (single-key call). Mirrors the Angular wallet's QubicRpcService.getBalances.
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

/** react-query fetcher; `balance` is the only field any reader consumes. */
export const fetchQutilBalance = async (identity: string): Promise<{ balance: bigint }> => ({
  balance: await fetchQutilBalanceValue(identity),
})
