import { useAddressName } from '@/hooks/use-address-name'
import { useProcedureName } from '@/hooks/use-procedure-name'
import { truncateString } from '@/lib/utils'

const CounterpartyLabel = ({ address }: { address: string }) => {
  const resolved = useAddressName(address)
  if (resolved) {
    return (
      <span className="text-xs text-muted-foreground">
        {resolved.name} <span className="font-mono text-[11px]">({truncateString(address)})</span>
      </span>
    )
  }
  return <span className="font-mono text-xs text-muted-foreground">{truncateString(address)}</span>
}

const InputTypeLabel = ({ destination, inputType }: { destination: string; inputType: number }) => {
  const procedureName = useProcedureName(destination, inputType)
  if (procedureName) {
    return (
      <span>
        {inputType} ({procedureName})
      </span>
    )
  }
  return <span>{inputType.toString()}</span>
}

export { CounterpartyLabel, InputTypeLabel }
