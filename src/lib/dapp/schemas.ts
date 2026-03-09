import { z } from 'zod'
import {
  DAPP_APPROVAL_METHODS,
  RUNTIME_APPROVAL_DECISION_TYPE,
  RUNTIME_EVENT_TYPE,
  RUNTIME_REQUEST_STATUS_TYPE,
  RUNTIME_REQUEST_TYPE,
  isDappApprovalDecision,
  isDappEventMessage,
  isDappRpcRequest,
  isDappRpcResponse,
  isDappRuntimeRequestStatusPayload,
  type DappApprovalDecision,
  type DappEventMessage,
  type DappRpcRequest,
  type DappRpcResponse,
  type DappRuntimeRequestStatusPayload,
} from '@/lib/dapp/protocol'

export const dappApprovalMethodSchema = z.enum(DAPP_APPROVAL_METHODS)

export const dappPendingRequestSchema = z.object({
  id: z.string().min(1),
  method: dappApprovalMethodSchema,
  origin: z.string().min(1),
  createdAt: z.number().finite(),
  params: z.unknown().optional(),
})

export const dappPermissionRecordSchema = z.object({
  origin: z.string().min(1),
  connectedAt: z.number().finite(),
})

export const dappPermissionsStateSchema = z.record(z.string(), dappPermissionRecordSchema)

export const dappRuntimeEnvelopeBaseSchema = z.object({
  type: z.enum([RUNTIME_REQUEST_TYPE, RUNTIME_REQUEST_STATUS_TYPE, RUNTIME_APPROVAL_DECISION_TYPE]),
  payload: z.unknown(),
})

export const dappRuntimeRequestEnvelopeSchema = z.object({
  type: z.literal(RUNTIME_REQUEST_TYPE),
  payload: z.custom<DappRpcRequest>((value) => isDappRpcRequest(value)),
})

export const dappRuntimeRequestStatusEnvelopeSchema = z.object({
  type: z.literal(RUNTIME_REQUEST_STATUS_TYPE),
  payload: z.custom<DappRuntimeRequestStatusPayload>((value) =>
    isDappRuntimeRequestStatusPayload(value),
  ),
})

export const dappRuntimeApprovalDecisionEnvelopeSchema = z.object({
  type: z.literal(RUNTIME_APPROVAL_DECISION_TYPE),
  payload: z.custom<DappApprovalDecision>((value) => isDappApprovalDecision(value)),
})

export const dappRuntimeEventEnvelopeSchema = z.object({
  type: z.literal(RUNTIME_EVENT_TYPE),
  payload: z.custom<DappEventMessage>((value) => isDappEventMessage(value)),
})

export const dappExecutionRequestSchema = z.object({
  id: z.string().min(1),
  method: dappApprovalMethodSchema,
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

export const dappRequestResultSchema = z.object({
  id: z.string().min(1),
  createdAt: z.number().finite(),
  origin: z.string().min(1),
  session: z.string().min(1),
  state: z.literal('ready'),
  response: z.custom<DappRpcResponse>((value) => isDappRpcResponse(value)),
})
