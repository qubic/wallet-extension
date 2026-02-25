import { z } from 'zod'
import { isDappRpcResponse, type DappRpcResponse } from '@/lib/dapp/protocol'
import {
  type DappExecutionRequest,
  type DappPendingRequest,
  getDappExecutionRequestById,
  getDappExecutionRequests,
  getDappPendingRequests,
  getDappRequestResultById,
  getDappRequestResults,
  removeDappExecutionRequest,
  removeDappRequestResult,
  setDappExecutionRequests,
  setDappPendingRequests,
  setDappRequestResults,
  upsertDappExecutionRequest,
  upsertDappRequestResult,
} from '@/lib/dapp/storage'
import { DAPP_APPROVAL_TIMEOUT_MS, DAPP_REQUEST_RESULT_TTL_MS } from '@/lib/dapp/timing'
import {
  decryptExecutionPayload,
  encryptExecutionPayload,
} from '@/lib/dapp/execution-payload-crypto'

const executionRequestSchema = z.object({
  id: z.string().min(1),
  method: z.enum(['connect', 'signMessage', 'signTransaction']),
  origin: z.string().min(1),
  createdAt: z.number().finite(),
  session: z.string().min(1),
  state: z.enum(['awaitingApproval', 'executing']),
  executionStartedAt: z.number().finite().optional(),
  encryptedParams: z.unknown().optional(),
  account: z
    .object({
      identity: z.string().min(1),
      name: z.string().optional(),
    })
    .optional(),
})

const requestResultSchema = z.object({
  id: z.string().min(1),
  createdAt: z.number().finite(),
  origin: z.string().min(1),
  session: z.string().min(1),
  state: z.literal('ready'),
  response: z.custom<DappRpcResponse>((value) => isDappRpcResponse(value)),
})

const pendingRequestSchema = z.object({
  id: z.string().min(1),
  method: z.enum(['connect', 'signMessage', 'signTransaction']),
  origin: z.string().min(1),
  createdAt: z.number().finite(),
  params: z.unknown().optional(),
})

const parseExecutionRequest = (value: DappExecutionRequest | null) => {
  if (!value) return null
  const parsed = executionRequestSchema.safeParse(value)
  return parsed.success ? (parsed.data as DappExecutionRequest) : null
}

export const pruneExpiredDappArtifacts = async () => {
  const now = Date.now()

  const pendingRequests = (await getDappPendingRequests()).filter(
    (entry) => pendingRequestSchema.safeParse(entry).success,
  )
  const nextPendingRequests = pendingRequests.filter(
    (request) => now - request.createdAt < DAPP_APPROVAL_TIMEOUT_MS,
  )
  if (nextPendingRequests.length !== pendingRequests.length) {
    await setDappPendingRequests(nextPendingRequests)
  }

  const executionRequests = (await getDappExecutionRequests()).filter(
    (entry) => executionRequestSchema.safeParse(entry).success,
  )
  const nextExecutionRequests = executionRequests.filter(
    (request) => now - request.createdAt < DAPP_APPROVAL_TIMEOUT_MS,
  )
  if (nextExecutionRequests.length !== executionRequests.length) {
    await setDappExecutionRequests(nextExecutionRequests)
  }

  const requestResults = (await getDappRequestResults()).filter(
    (entry) => requestResultSchema.safeParse(entry).success,
  )
  const nextRequestResults = requestResults.filter(
    (result) => now - result.createdAt < DAPP_REQUEST_RESULT_TTL_MS,
  )
  if (nextRequestResults.length !== requestResults.length) {
    await setDappRequestResults(nextRequestResults)
  }
}

export const appendPendingApprovalRequest = async (request: DappPendingRequest) => {
  await pruneExpiredDappArtifacts()
  const requests = await getDappPendingRequests()
  await setDappPendingRequests([...requests, request])
}

export const removePendingApprovalRequest = async (id: string) => {
  const requests = await getDappPendingRequests()
  await setDappPendingRequests(requests.filter((request) => request.id !== id))
}

export const persistExecutionRequest = async (request: DappExecutionRequest) => {
  const encryptedParams = await encryptExecutionPayload(request.params)
  const parsed = executionRequestSchema.parse({
    ...request,
    params: undefined,
    encryptedParams,
  })
  await pruneExpiredDappArtifacts()
  await upsertDappExecutionRequest(parsed)
}

export const getExecutionRequestById = async (id: string) => {
  const stored = parseExecutionRequest(await getDappExecutionRequestById(id))
  if (!stored) return null
  const decryptedParams = await decryptExecutionPayload(stored.encryptedParams)
  return {
    ...stored,
    params: decryptedParams,
  } as DappExecutionRequest
}

export const markExecutionRequestExecuting = async (id: string) => {
  const request = await getExecutionRequestById(id)
  if (!request) return null
  if (request.state !== 'awaitingApproval') return null

  const next: DappExecutionRequest = {
    ...request,
    state: 'executing',
    executionStartedAt: Date.now(),
  }
  await upsertDappExecutionRequest(executionRequestSchema.parse(next))
  return next
}

export const completeExecutionRequest = async (id: string) => {
  await Promise.all([removePendingApprovalRequest(id), removeDappExecutionRequest(id)])
}

export const storeRequestResult = async (
  request: Pick<DappExecutionRequest, 'id' | 'origin' | 'session'>,
  response: DappRpcResponse,
) => {
  const result = requestResultSchema.parse({
    id: response.id,
    createdAt: Date.now(),
    origin: request.origin,
    session: request.session,
    state: 'ready',
    response,
  })
  await upsertDappRequestResult(
    result as {
      id: string
      createdAt: number
      origin: string
      session: string
      state: 'ready'
      response: DappRpcResponse
    },
  )
}

export const getRequestResultById = async (id: string) => {
  const result = await getDappRequestResultById(id)
  if (!result) return null
  const parsed = requestResultSchema.safeParse(result)
  if (!parsed.success) return null
  return parsed.data as {
    id: string
    createdAt: number
    origin: string
    session: string
    state: 'ready'
    response: DappRpcResponse
  }
}

export const consumeRequestResultById = async (id: string) => {
  const result = await getRequestResultById(id)
  if (!result) return null
  await removeDappRequestResult(id)
  return result
}

export const discardRequestResult = async (id: string) => {
  await removeDappRequestResult(id)
}
