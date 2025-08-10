import { z } from 'zod'
import { paginationSchema } from '.'
import { TransactionType } from '@prisma/client'

export const createTransactionBodySchema = z.object({
  value: z.number(),
  description: z.string().min(1, 'Required field.'),
})

export const createInternalTransferBodySchema = z.object({
  receiverAccountId: z.uuid(),
  value: z.number(),
  description: z.string().min(1, 'Required field.'),
})

export const idTransactionParamsSchema = z.object({
  transactionId: z.uuid(),
})

export const transactionPaginationSchema = paginationSchema.extend({
  type: z.enum(TransactionType).optional(),
})
