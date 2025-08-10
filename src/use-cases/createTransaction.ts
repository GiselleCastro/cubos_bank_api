import type { TransactionsRepository } from '../repositories/transactions'
import {
  AppError,
  ForbiddenError,
  InternalServerError,
  PaymentRequiredError,
} from '../err/appError'
import { v4 as uuid } from 'uuid'
import type {
  CreateTransactionData,
  CreateTransactionReturn,
} from '../types/transactions'
import { TransactionStatus, TransactionType } from '@prisma/client'
import type { AccountsRepository } from '../repositories/accounts'
import { convertReaisToCents } from '../utils/moneyConverter'
import { inferTransactionType } from '../utils/transactionType'
import type { CompilanceAPI } from '../infrastructures/compilanceAPI'
import { pollingTransactionStatus } from '../utils/pollingTransactionStatus'
import type { CheckTransactionsService } from '../services/checkTransactions'
import { logger } from '../config/logger'

export class CreateTransactionUseCase {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly compilanceAPI: CompilanceAPI,
    private readonly checkTransactionsService: CheckTransactionsService,
  ) {}

  async execute(
    data: CreateTransactionData,
    userId: string,
    accountId: string,
  ): Promise<CreateTransactionReturn> {
    try {
      const registeredAccount = await this.accountsRepository.findByAccountId(accountId)

      if (!registeredAccount || registeredAccount.userId !== userId) {
        throw new ForbiddenError(
          'Access denied. This account does not belong to the authenticated user.',
        )
      }

      const transactionType = inferTransactionType(data.value)

      const absoluteAmountInCentsOfTheTransaction = Math.abs(
        convertReaisToCents(data.value),
      )

      await this.checkTransactionsService.execute(accountId, userId)

      const updateRegisteredAccount =
        await this.accountsRepository.findByAccountId(accountId)

      let balanceUpdated: number

      if (transactionType === TransactionType.debit) {
        balanceUpdated =
          updateRegisteredAccount!.balance - absoluteAmountInCentsOfTheTransaction

        if (balanceUpdated < 0) {
          throw new PaymentRequiredError('Insufficient balance.')
        }
      } else {
        balanceUpdated =
          updateRegisteredAccount!.balance + absoluteAmountInCentsOfTheTransaction
      }

      const empontentId = uuid()

      const transactionId = uuid()

      await this.compilanceAPI.createTransaction(empontentId, {
        description: data.description,
        externalId: transactionId,
      })

      const status = await pollingTransactionStatus(empontentId, () =>
        this.compilanceAPI.getTransactionById(empontentId),
      )

      const registeredTransaction = await this.transactionsRepository.create(
        {
          id: transactionId,
          value: absoluteAmountInCentsOfTheTransaction,
          type: transactionType,
          description: data.description,
          accountId,
          empontentId,
          status,
        },
        status === TransactionStatus.authorized ? balanceUpdated : null,
      )

      if (status === TransactionStatus.unauthorized) {
        throw new PaymentRequiredError('Payment refused by Compilance API.')
      }

      const transactionCreated = {
        id: registeredTransaction.id,
        value: data.value,
        description: registeredTransaction.description,
        createdAt: registeredTransaction.createdAt,
        updatedAt: registeredTransaction.updatedAt,
      }

      logger.info({ status, ...transactionCreated })

      return transactionCreated
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new InternalServerError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message || 'Error checking balance.',
      )
    }
  }
}
