import { qUtilGetBalances16 } from '@qubic.org/contracts'
import { identityToPublicKey } from '@qubic.org/crypto'
import { createLiveClient } from '@qubic.org/rpc'
import { QUBIC_RPC_BASE_URL } from '@/lib/config/constants'

// The live client does not append `/live/v1` itself — the base URL must include it.
const live = createLiveClient({ baseUrl: `${QUBIC_RPC_BASE_URL}/live/v1` })

const idToPk = identityToPublicKey as (id: string) => Uint8Array

const MAX_KEYS_PER_CALL = 16

/** Shared per-identity balance query key — every balance reader must use it. */
export const qutilBalanceQueryKey = (identity: string) => ['qubic', 'balance', identity]

/** On-chain QU balances via QUTIL GetBalances16, batched 16 identities per call. */
export const fetchQutilBalances = async (ids: string[]): Promise<Map<string, bigint>> => {
  const result = new Map<string, bigint>()
  const batches: string[][] = []
  for (let i = 0; i < ids.length; i += MAX_KEYS_PER_CALL) {
    batches.push(ids.slice(i, i + MAX_KEYS_PER_CALL))
  }
  await Promise.all(
    batches.map(async (batch) => {
      const r = await qUtilGetBalances16(
        live,
        { publicKeys: batch },
        { identityToPublicKey: idToPk },
      )
      if (!r.ok) throw r.error
      batch.forEach((id, j) => {
        result.set(id, r.value.balances[j] ?? 0n)
      })
    }),
  )
  return result
}

export const fetchQutilBalanceValue = async (identity: string): Promise<bigint> =>
  (await fetchQutilBalances([identity])).get(identity) ?? 0n

export const fetchQutilBalance = async (identity: string): Promise<{ balance: bigint }> => ({
  balance: await fetchQutilBalanceValue(identity),
})
