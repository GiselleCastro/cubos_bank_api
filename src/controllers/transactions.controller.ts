import type { NextFunction, Request, Response } from 'express'
import type { CreateTransactionUseCase } from '../use-cases/createTransaction'
import type { ListOfAllTransactionsUseCase } from '../use-cases/listOfAllTransactions'
import type { CreateInternalTransferUseCase } from '../use-cases/createInternalTransfer'
import type { ReverseTransactionUseCase } from '../use-cases/reverseTransaction'
import { TransactionType } from '@prisma/client'
import { HttpStatusCode } from 'axios'

export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly listOfAllTransactionsUseCase: ListOfAllTransactionsUseCase,
    private readonly createInternalTransferUseCase: CreateInternalTransferUseCase,
    private readonly reverseTransactionUseCase: ReverseTransactionUseCase,
  ) {}

  createTransaction() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.headers.authorization as string
        const accountId = req.params.accountId as string
        const result = await this.createTransactionUseCase.execute(
          req.body,
          userId,
          accountId,
        )
        return res.status(HttpStatusCode.Created).json(result)
      } catch (error) {
        next(error)
      }
    }
  }

  createInternalTransfer() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const accountId = req.params.accountId as string
        const userId = req.headers.authorization as string
        const result = await this.createInternalTransferUseCase.execute(
          req.body,
          accountId,
          userId,
        )
        return res.status(HttpStatusCode.Created).json(result)
      } catch (error) {
        next(error)
      }
    }
  }

  reverseTransaction() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const accountId = req.params.accountId as string
        const transactionId = req.params.transactionId as string
        const userId = req.headers.authorization as string
        const result = await this.reverseTransactionUseCase.execute(
          accountId,
          transactionId,
          userId,
        )
        return res.status(HttpStatusCode.Ok).json(result)
      } catch (error) {
        next(error)
      }
    }
  }

  listOfAllTransactions() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.headers.authorization as string
        const accountId = req.params.accountId as string
        const itemsPerPage = req.query?.itemsPerPage
        const currentPage = req.query?.currentPage
        const type = req.query?.type
        const args = {
          accountId,
          userId,
          ...(itemsPerPage && { itemsPerPage: +itemsPerPage }),
          ...(currentPage && { currentPage: +currentPage }),
          ...(type && { type: type as TransactionType }),
        }
        const result = await this.listOfAllTransactionsUseCase.execute(args)
        return res.status(HttpStatusCode.Ok).json(result)
      } catch (error) {
        next(error)
      }
    }
  }
}
