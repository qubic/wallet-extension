import { useMemo } from 'react'
import { useSmartContracts } from '@/lib/qubic-static'

export const useProcedureName = (destination: string, inputType: number): string | undefined => {
  const { data: smartContracts } = useSmartContracts()

  return useMemo(() => {
    if (!smartContracts || !destination || inputType === 0) return undefined

    const contract = smartContracts.find((sc) => sc.address === destination)
    if (!contract) return undefined

    const procedure = contract.procedures.find((p) => p.id === inputType)
    return procedure?.name
  }, [destination, inputType, smartContracts])
}
