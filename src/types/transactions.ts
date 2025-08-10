import { z } from 'zod'
import {
  createTransactionBodySchema,
  createInternalTransferBodySchema,
  transactionPaginationSchema,
} from '../schema/transactions'
import { TransactionStatus, TransactionType } from '@prisma/client'
import { Pagination } from '.'

export type CreateTransactionData = z.infer<typeof createTransactionBodySchema>

export type CreateTransactionReturn = CreateTransactionData & {
  id: string
  createdAt: Date
  updatedAt: Date
}

export type CreateTransactionCompilanceAPI = {
  description: string
  externalId: string
}

type TransactionCompilanceAPI = {
  id: string
  externalId: string
  description: string
  userId: string
  status: TransactionStatus
}

export type TransactionCompilanceAPIResponse = {
  success: boolean
  data: TransactionCompilanceAPI
}

export type ListTransactionCompilanceAPIResponse = {
  success: boolean
  data: TransactionCompilanceAPI[]
}

export type CreateTransaction = CreateTransactionData & {
  id: string
  accountId: string
  type: TransactionType
  status: TransactionStatus
  empontentId?: string
  relatedTransactionId?: string
}

export type RevertTransaction = CreateTransaction & {
  reversedById: string
}

export type PaginationByTransaction = z.infer<typeof transactionPaginationSchema> & {
  accountId: string
  userId: string
}

export type TransactionsReturnPagination = {
  transactions: CreateTransactionReturn[]
  pagination: Pagination
}

export type CreateInternalTransferData = z.infer<typeof createInternalTransferBodySchema>

export type CreateInternalTransaction = CreateTransaction & {
  id: string
  type: TransactionType
  accountId: string
}

export type CreateInternalTransferReturn = CreateTransactionData & {
  id: string
  type: TransactionType
  accountId: string
}
