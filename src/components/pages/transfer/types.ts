export type FormErrors = {
  recipient?: string
  amount?: string
  targetTick?: string
}

export type TxResult = {
  txId: string
  targetTick: string
  amount: bigint
  tokenName: string
  sourceIdentity: string
  recipient: string
  fee: bigint
}
