import { useQuery } from '@tanstack/react-query'
import type {
  SmartContract,
  AddressLabel,
  Exchange,
  Token,
  GetSmartContractsResponse,
  GetAddressLabelsResponse,
  GetExchangesResponse,
  GetTokensResponse,
} from './qubic-static.types'

const STATIC_BASE_URL = 'https://static.qubic.org'
const GENERAL_DATA_PATH = '/v1/general/data'

const STATIC_STALE_TIME = 86_400_000 // 24 hours

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${STATIC_BASE_URL}${GENERAL_DATA_PATH}${path}`)
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
    staleTime: STATIC_STALE_TIME,
  })

export const useAddressLabels = () =>
  useQuery({
    queryKey: ['qubic-static', 'address-labels'],
    queryFn: async (): Promise<AddressLabel[]> => {
      const data = await fetchJson<GetAddressLabelsResponse>('/address_labels.json')
      return data.address_labels
    },
    staleTime: STATIC_STALE_TIME,
  })

export const useExchanges = () =>
  useQuery({
    queryKey: ['qubic-static', 'exchanges'],
    queryFn: async (): Promise<Exchange[]> => {
      const data = await fetchJson<GetExchangesResponse>('/exchanges.json')
      return data.exchanges
    },
    staleTime: STATIC_STALE_TIME,
  })

export const useTokens = () =>
  useQuery({
    queryKey: ['qubic-static', 'tokens'],
    queryFn: async (): Promise<Token[]> => {
      const data = await fetchJson<GetTokensResponse>('/tokens.json')
      return data.tokens
    },
    staleTime: STATIC_STALE_TIME,
  })
