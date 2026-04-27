import { useAddressName } from '@/hooks/use-address-name'
import { SmartContractIcon } from '@/components/icons/smart-contract-icon'
import { truncateString } from '@/lib/utils'

type AddressLabelProps = {
  address: string
  className?: string
  prefix?: string
}

const AddressLabel = ({ address, className, prefix }: AddressLabelProps) => {
  const resolved = useAddressName(address)

  if (resolved) {
    return (
      <span className={`inline-flex items-center gap-1 ${className ?? ''}`}>
        {prefix && `${prefix} `}
        {resolved.type === 'smartContract' && (
          <SmartContractIcon className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">
          {resolved.name} <span className="font-mono">({truncateString(address)})</span>
        </span>
      </span>
    )
  }

  return (
    <span className={`font-mono ${className ?? ''}`}>
      {prefix && `${prefix} `}
      {truncateString(address)}
    </span>
  )
}

export default AddressLabel
