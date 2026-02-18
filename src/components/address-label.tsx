import { useAddressName } from '@/hooks/use-address-name'
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
      <span className={className}>
        {prefix && `${prefix} `}
        {resolved.name} <span className="font-mono">({truncateString(address)})</span>
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
