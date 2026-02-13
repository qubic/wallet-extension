import { useQuery } from '@tanstack/react-query'

export type OwnedAssetsResponse = {
  ownedAssets?: Array<{
    data?: {
      numberOfUnits?: string
      issuedAsset?: {
        name?: string
        numberOfDecimalPlaces?: number
        unitOfMeasurement?: number[]
        type?: number
        issuerIdentity?: string
      }
    }
  }>
}

export const fetchOwnedAssets = async (identity: string): Promise<OwnedAssetsResponse> => {
  const response = await fetch(`https://rpc.qubic.org/live/v1/assets/${identity}/owned`, {
    headers: { accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to load assets.')
  }
  return response.json() as Promise<OwnedAssetsResponse>
}

export const formatAssetUnits = (units: string | undefined, decimals = 0) => {
  if (!units) return '--'
  if (decimals <= 0) return Number(units).toLocaleString()
  const padded = units.padStart(decimals + 1, '0')
  const whole = padded.slice(0, -decimals)
  const fraction = padded.slice(-decimals).replace(/0+$/, '')
  return `${Number(whole).toLocaleString()}${fraction ? `.${fraction}` : ''}`
}

export const useOwnedAssets = (identity: string) => {
  return useQuery({
    queryKey: ['qubic', 'owned-assets', identity],
    queryFn: () => fetchOwnedAssets(identity),
    enabled: Boolean(identity),
    staleTime: 60_000,
  })
}
