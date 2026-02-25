import { z } from 'zod'
import { isDappRpcResponse, type DappRpcResponse } from '@/lib/dapp/protocol'

export const dappPendingRequestSchema = z.object({
  id: z.string().min(1),
  method: z.enum(['connect', 'signMessage', 'signTransaction']),
  origin: z.string().min(1),
  createdAt: z.number().finite(),
  params: z.unknown().optional(),
})

export const dappPermissionRecordSchema = z.object({
  origin: z.string().min(1),
  connectedAt: z.number().finite(),
})

export const dappPermissionsStateSchema = z.record(z.string(), dappPermissionRecordSchema)

export const dappExecutionRequestSchema = z.object({
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

export const dappRequestResultSchema = z.object({
  id: z.string().min(1),
  createdAt: z.number().finite(),
  origin: z.string().min(1),
  session: z.string().min(1),
  state: z.literal('ready'),
  response: z.custom<DappRpcResponse>((value) => isDappRpcResponse(value)),
})
