import { useQuery } from '@tanstack/react-query'
import type {
  SmartContract,
  AddressLabel,
  Exchange,
  GetSmartContractsResponse,
  GetAddressLabelsResponse,
  GetExchangesResponse,
} from './qubic-static.types'
import { QUBIC_STATIC_BASE_URL } from './config/constants'
import { STALE_TIME_STATIC_DATA } from './config/refresh-intervals'

const GENERAL_DATA_PATH = '/v1/general/data'

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${QUBIC_STATIC_BASE_URL}${GENERAL_DATA_PATH}${path}`)
  if (!response.ok) throw new Error(`Failed to load ${path}`)
  return response.json() as Promise<T>
}

export const useSmartContracts = () =>
  useQuery({
    queryKey: ['qubic-static', 'smart-contracts'],
    queryFn: async (): Promise<SmartContract[]> => {
      const data = await fetchJson<GetSmartContractsResponse>('/smart_contracts.json')
      return data.smart_contracts
    },
    staleTime: STALE_TIME_STATIC_DATA,
  })

export const useAddressLabels = () =>
  useQuery({
    queryKey: ['qubic-static', 'address-labels'],
    queryFn: async (): Promise<AddressLabel[]> => {
      const data = await fetchJson<GetAddressLabelsResponse>('/address_labels.json')
      return data.address_labels
    },
    staleTime: STALE_TIME_STATIC_DATA,
  })

export const useExchanges = () =>
  useQuery({
    queryKey: ['qubic-static', 'exchanges'],
    queryFn: async (): Promise<Exchange[]> => {
      const data = await fetchJson<GetExchangesResponse>('/exchanges.json')
      return data.exchanges
    },
    staleTime: STALE_TIME_STATIC_DATA,
  })
