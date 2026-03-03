import { useQuery } from '@tanstack/react-query'

const QX_MANAGING_CONTRACT_INDEX = 1
const ASSET_ISSUANCES_STALE_TIME = 86_400_000 // 24 hours

export type OwnedAssetsResponse = {
  ownedAssets?: Array<{
    data?: {
      managingContractIndex?: number
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

export type AggregatedAsset = {
  name: string
  issuerIdentity: string
  numberOfUnits: string
  decimals: number
}

export const aggregateAssets = (
  response: OwnedAssetsResponse,
  filterByQxManagement = false,
): AggregatedAsset[] => {
  const map = new Map<string, AggregatedAsset>()

  for (const entry of response.ownedAssets ?? []) {
    const info = entry.data
    const issued = info?.issuedAsset
    if (!issued?.name || !info?.numberOfUnits) continue

    if (filterByQxManagement && info.managingContractIndex !== QX_MANAGING_CONTRACT_INDEX) continue

    const key = `${issued.issuerIdentity ?? ''}-${issued.name}`
    const existing = map.get(key)

    if (existing) {
      existing.numberOfUnits = (
        BigInt(existing.numberOfUnits) + BigInt(info.numberOfUnits)
      ).toString()
    } else {
      map.set(key, {
        name: issued.name,
        issuerIdentity: issued.issuerIdentity ?? '',
        numberOfUnits: info.numberOfUnits,
        decimals: issued.numberOfDecimalPlaces ?? 0,
      })
    }
  }

  return [...map.values()].filter((a) => BigInt(a.numberOfUnits) > 0n)
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

export type AssetIssuance = {
  data: {
    issuerIdentity: string
    type: number
    name: string
    numberOfDecimalPlaces: number
    unitOfMeasurement: number[]
  }
  tick: number
  universeIndex: number
}

export type AssetIssuancesResponse = {
  assets: AssetIssuance[]
}
 //TODO: Use constant for API base URL and handle errors more gracefully in the UI 
const fetchAssetIssuances = async (): Promise<AssetIssuancesResponse> => {
  const response = await fetch('https://rpc.qubic.org/live/v1/assets/issuances', {
    headers: { accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to load asset issuances.')
  }
  return response.json() as Promise<AssetIssuancesResponse>
}

export const useAssetIssuances = () => {
  return useQuery({
    queryKey: ['qubic', 'asset-issuances'],
    queryFn: fetchAssetIssuances,
    staleTime: ASSET_ISSUANCES_STALE_TIME,
  })
}
