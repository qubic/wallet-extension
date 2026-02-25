import type { DappRpcResponse } from '@/lib/dapp/protocol'
import {
  type DappExecutionRequest,
  type DappPendingRequest,
  type DappRequestResultRecord,
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
import { dappExecutionRequestSchema, dappRequestResultSchema } from '@/lib/dapp/schemas'
import { DAPP_APPROVAL_TIMEOUT_MS, DAPP_REQUEST_RESULT_TTL_MS } from '@/lib/dapp/timing'
import {
  decryptExecutionPayload,
  encryptExecutionPayload,
} from '@/lib/dapp/execution-payload-crypto'

const parseExecutionRequest = (value: DappExecutionRequest | null) => {
  if (!value) return null
  const parsed = dappExecutionRequestSchema.safeParse(value)
  return parsed.success ? (parsed.data as DappExecutionRequest) : null
}

export const pruneExpiredDappArtifacts = async () => {
  const now = Date.now()

  const pendingRequests = await getDappPendingRequests()
  const nextPendingRequests = pendingRequests.filter(
    (request) => now - request.createdAt < DAPP_APPROVAL_TIMEOUT_MS,
  )
  if (nextPendingRequests.length !== pendingRequests.length) {
    await setDappPendingRequests(nextPendingRequests)
  }

  const executionRequests = await getDappExecutionRequests()
  const nextExecutionRequests = executionRequests.filter(
    (request) => now - request.createdAt < DAPP_APPROVAL_TIMEOUT_MS,
  )
  if (nextExecutionRequests.length !== executionRequests.length) {
    await setDappExecutionRequests(nextExecutionRequests)
  }

  const requestResults = await getDappRequestResults()
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
  const parsed = dappExecutionRequestSchema.parse({
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
  await upsertDappExecutionRequest(dappExecutionRequestSchema.parse(next))
  return next
}

export const completeExecutionRequest = async (id: string) => {
  await Promise.all([removePendingApprovalRequest(id), removeDappExecutionRequest(id)])
}

export const storeRequestResult = async (
  request: Pick<DappExecutionRequest, 'id' | 'origin' | 'session'>,
  response: DappRpcResponse,
) => {
  const result: DappRequestResultRecord = dappRequestResultSchema.parse({
    id: response.id,
    createdAt: Date.now(),
    origin: request.origin,
    session: request.session,
    state: 'ready',
    response,
  })
  await upsertDappRequestResult(result)
}

export const getRequestResultById = async (id: string) => {
  const result = await getDappRequestResultById(id)
  if (!result) return null
  const parsed = dappRequestResultSchema.safeParse(result)
  if (!parsed.success) return null
  return parsed.data as DappRequestResultRecord
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
