import { useTranslation } from 'react-i18next'
import { useProcedureName } from '@/hooks/use-procedure-name'

export const useTxTypeDescription = (destination: string, inputType: number): string => {
  const { t } = useTranslation()
  const procedureName = useProcedureName(destination, inputType)

  if (procedureName) return `${procedureName} (${inputType})`
  if (inputType === 0) return `${t('transaction.txTypeTransfer')} (0)`
  return String(inputType)
}
