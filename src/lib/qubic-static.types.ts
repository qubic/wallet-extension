export type SmartContractProcedure = {
  id: number
  name: string
}

export type SmartContract = {
  filename: string
  name: string
  label: string
  githubUrl: string
  contractIndex: number
  address: string
  procedures: SmartContractProcedure[]
  website?: string
  proposalUrl?: string
}

export type AddressLabel = {
  label: string
  address: string
}

export type GetSmartContractsResponse = {
  smart_contracts: SmartContract[]
}

export type GetAddressLabelsResponse = {
  address_labels: AddressLabel[]
}

export type Exchange = {
  name: string
  address: string
}

export type GetExchangesResponse = {
  exchanges: Exchange[]
}
