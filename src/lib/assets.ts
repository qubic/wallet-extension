import { useQuery } from '@tanstack/react-query'
import { QUBIC_RPC_BASE_URL } from './config/constants'
import { STALE_TIME_ASSET_ISSUANCES } from './config/refresh-intervals'

const QX_MANAGING_CONTRACT_INDEX = 1

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
  const response = await fetch(`${QUBIC_RPC_BASE_URL}/v1/assets/${identity}/owned`, {
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
const fetchAssetIssuances = async (): Promise<AssetIssuancesResponse> => {
  const response = await fetch(`${QUBIC_RPC_BASE_URL}/v1/assets/issuances`, {
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
    staleTime: STALE_TIME_ASSET_ISSUANCES,
  })
}
