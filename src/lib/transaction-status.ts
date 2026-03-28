/**
 * Transaction status helpers — mirrors the logic in wallet-app (Flutter) and wallet (Angular).
 *
 * Status resolution uses the `moneyFlew` field from the archiver API to determine
 * whether a confirmed transaction actually moved funds.
 */

/** QUTIL smart-contract address (SendMany destination) */
const QUTIL_ADDRESS = 'EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVWRF'
/** QUTIL SendMany input type */
const QUTIL_SENDMANY_INPUT_TYPE = 1

export type ComputedTransactionStatus = 'pending' | 'success' | 'failure' | 'invalid' | 'executed'

const isSimpleTransfer = (inputType: number, amount: number | bigint): boolean =>
  inputType === 0 && amount > 0

const isSendManyTransaction = (destination: string | undefined, inputType: number): boolean =>
  destination === QUTIL_ADDRESS && inputType === QUTIL_SENDMANY_INPUT_TYPE

/**
 * Returns `true` when `moneyFlew` is a definitive success/failure indicator
 * for this transaction type (simple transfer or SendMany).
 */
export const hasDefinitiveStatus = (
  inputType: number,
  amount: number | bigint,
  destination?: string,
): boolean => isSimpleTransfer(inputType, amount) || isSendManyTransaction(destination, inputType)

/**
 * Compute the status of a confirmed (archived) transaction.
 * Matches `computeArchivedTransactionStatus` from wallet and
 * `getTransactionStatus` from wallet-app.
 */
export const computeTransactionStatus = (
  inputType: number,
  amount: number | bigint,
  moneyFlew: boolean,
  destination?: string,
): ComputedTransactionStatus => {
  if (hasDefinitiveStatus(inputType, amount, destination)) {
    return moneyFlew ? 'success' : 'failure'
  }
  return 'executed'
}
