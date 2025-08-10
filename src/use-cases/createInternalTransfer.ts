import type { TransactionsRepository } from '../repositories/transactions'
import {
  AppError,
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  PaymentRequiredError,
} from '../err/appError'
import type { CreateInternalTransferData } from '../types/transactions'
import { v4 as uuid } from 'uuid'
import { TransactionStatus, TransactionType } from '@prisma/client'
import type { AccountsRepository } from '../repositories/accounts'
import { convertReaisToCents } from '../utils/moneyConverter'
import { inferTransactionType, invertTransactionType } from '../utils/transactionType'
import { CheckTransactionsService } from '../services/checkTransactions'

export class CreateInternalTransferUseCase {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly checkTransactionsService: CheckTransactionsService,
  ) {}

  async execute(
    data: CreateInternalTransferData,
    accountIdAccountOwner: string,
    userId: string,
  ) {
    try {
      const registeredAccountOwner =
        await this.accountsRepository.findByAccountId(accountIdAccountOwner)

      if (!registeredAccountOwner || registeredAccountOwner.userId !== userId) {
        throw new ForbiddenError(
          'Access denied. This account does not belong to the authenticated user.',
        )
      }

      const { receiverAccountId } = data

      if (receiverAccountId === accountIdAccountOwner) {
        throw new BadRequestError('Transfer to the same account is not allowed.')
      }

      const registeredAccountReceiver =
        await this.accountsRepository.findByAccountId(receiverAccountId)

      if (!registeredAccountReceiver) {
        throw new BadRequestError('Non-existent account for receiver.')
      }

      const transactionType = inferTransactionType(data.value)

      const absoluteAmountInCentsOfTheTransaction = Math.abs(
        convertReaisToCents(data.value),
      )

      await Promise.allSettled([
        this.checkTransactionsService.execute(
          accountIdAccountOwner,
          registeredAccountOwner.userId,
        ),
        this.checkTransactionsService.execute(
          receiverAccountId,
          registeredAccountReceiver.userId,
        ),
      ])

      const [updatedRegisteredAccountOwner, updatedRegisteredAccountReceiver] =
        await Promise.all([
          this.accountsRepository.findByAccountId(accountIdAccountOwner),
          this.accountsRepository.findByAccountId(receiverAccountId),
        ])

      let balanceCurrentOwner: number
      let balanceCurrentReceiver: number

      if (transactionType === TransactionType.debit) {
        balanceCurrentOwner =
          updatedRegisteredAccountOwner!.balance - absoluteAmountInCentsOfTheTransaction
        if (balanceCurrentOwner < 0) {
          throw new PaymentRequiredError("Insufficient balance in the owner's account.")
        }
        balanceCurrentReceiver =
          updatedRegisteredAccountReceiver!.balance +
          absoluteAmountInCentsOfTheTransaction
      } else {
        balanceCurrentReceiver =
          updatedRegisteredAccountReceiver!.balance -
          absoluteAmountInCentsOfTheTransaction
        if (balanceCurrentReceiver < 0) {
          throw new PaymentRequiredError(
            "Insufficient balance in the receiver's account.",
          )
        }
        balanceCurrentOwner =
          updatedRegisteredAccountOwner!.balance + absoluteAmountInCentsOfTheTransaction
      }

      const relatedTransactionId = uuid()

      const transactionOwnerAccount = {
        id: uuid(),
        value: absoluteAmountInCentsOfTheTransaction,
        type: transactionType,
        description: data.description,
        accountId: accountIdAccountOwner,
        relatedTransactionId,
        status: TransactionStatus.authorized,
      }

      const transactionReceiverAccount = {
        id: uuid(),
        value: absoluteAmountInCentsOfTheTransaction,
        type: invertTransactionType(transactionType),
        description: data.description,
        accountId: receiverAccountId,
        relatedTransactionId,
        status: TransactionStatus.authorized,
      }

      const registeredTransaction = await this.transactionsRepository.createInternal(
        transactionOwnerAccount,
        transactionReceiverAccount,
        balanceCurrentOwner,
        balanceCurrentReceiver,
      )

      const transactionCreated = {
        id: registeredTransaction.id,
        value: data.value,
        description: registeredTransaction.description,
        createdAt: registeredTransaction.createdAt,
        updatedAt: registeredTransaction.updatedAt,
      }

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
