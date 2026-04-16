import { useAddressName } from '@/hooks/use-address-name'
import { truncateAccountName, truncateString } from '@/lib/utils'

type AddressLabelProps = {
  address: string
  className?: string
  prefix?: string
}

const AddressLabel = ({ address, className, prefix }: AddressLabelProps) => {
  const resolved = useAddressName(address)

  if (resolved) {
    const accountName = resolved.type === 'account' ? truncateAccountName(resolved.name) : undefined
    const displayName = accountName?.text ?? resolved.name

    return (
      <span className={className} title={accountName?.isTruncated ? resolved.name : undefined}>
        {prefix && `${prefix} `}
        {displayName} <span className="font-mono">({truncateString(address)})</span>
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
