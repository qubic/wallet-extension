import { beforeEach, describe, expect, it, vi } from 'vitest'

const { qUtilGetBalances16 } = vi.hoisted(() => ({ qUtilGetBalances16: vi.fn() }))

vi.mock('@qubic.org/contracts', () => ({ qUtilGetBalances16 }))
vi.mock('@qubic.org/crypto', () => ({ identityToPublicKey: () => new Uint8Array(32) }))
vi.mock('@qubic.org/rpc', () => ({ createLiveClient: () => ({}) }))

import { fetchQutilBalanceValue, fetchQutilBalances } from './qutil-balances'

const IDENTITY = 'A'.repeat(60)

beforeEach(() => {
  qUtilGetBalances16.mockReset()
})

describe('fetchQutilBalanceValue', () => {
  it('returns the first balance from a successful result', async () => {
    qUtilGetBalances16.mockResolvedValue({ ok: true, value: { balances: [123n] } })
    await expect(fetchQutilBalanceValue(IDENTITY)).resolves.toBe(123n)
  })

  it('defaults to 0n when no balance is returned', async () => {
    qUtilGetBalances16.mockResolvedValue({ ok: true, value: { balances: [] } })
    await expect(fetchQutilBalanceValue(IDENTITY)).resolves.toBe(0n)
  })

  it('throws the error when the result is not ok', async () => {
    const error = new Error('rpc failed')
    qUtilGetBalances16.mockResolvedValue({ ok: false, error })
    await expect(fetchQutilBalanceValue(IDENTITY)).rejects.toBe(error)
  })

  it('calls the helper with the single identity and an injected identityToPublicKey', async () => {
    qUtilGetBalances16.mockResolvedValue({ ok: true, value: { balances: [0n] } })
    await fetchQutilBalanceValue(IDENTITY)
    expect(qUtilGetBalances16).toHaveBeenCalledTimes(1)
    const [, input, options] = qUtilGetBalances16.mock.calls[0]
    expect(input).toEqual({ publicKeys: [IDENTITY] })
    expect(typeof options.identityToPublicKey).toBe('function')
  })
})

describe('fetchQutilBalances', () => {
  it('batches ids in groups of 16 and assembles the map in input order', async () => {
    qUtilGetBalances16.mockImplementation(async (_live, input) => ({
      ok: true,
      value: { balances: input.publicKeys.map((_id: string, i: number) => BigInt(i)) },
    }))
    const ids = Array.from({ length: 17 }, (_, i) => `ID${i}`)
    const map = await fetchQutilBalances(ids)
    expect(qUtilGetBalances16).toHaveBeenCalledTimes(2)
    expect(qUtilGetBalances16.mock.calls[0][1].publicKeys).toHaveLength(16)
    expect(qUtilGetBalances16.mock.calls[1][1].publicKeys).toHaveLength(1)
    expect(map.size).toBe(17)
    expect(map.get('ID0')).toBe(0n)
    expect(map.get('ID15')).toBe(15n)
    expect(map.get('ID16')).toBe(0n)
  })

  it('defaults a missing balance slot to 0n', async () => {
    qUtilGetBalances16.mockResolvedValue({ ok: true, value: { balances: [] } })
    const map = await fetchQutilBalances(['A'])
    expect(map.get('A')).toBe(0n)
  })

  it('throws when a batch is not ok', async () => {
    const error = new Error('rpc failed')
    qUtilGetBalances16.mockResolvedValue({ ok: false, error })
    await expect(fetchQutilBalances(['A'])).rejects.toBe(error)
  })
})
