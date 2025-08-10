import type { TransactionsRepository } from '../repositories/transactions'
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  PaymentRequiredError,
} from '../err/appError'
import { v4 as uuid } from 'uuid'
import { Transactions, TransactionStatus, TransactionType } from '@prisma/client'
import type { AccountsRepository } from '../repositories/accounts'
import {
  convertAbsoluteAmountToAmount,
  convertCentsToReais,
} from '../utils/moneyConverter'
import { invertTransactionType } from '../utils/transactionType'
import type { CompilanceAPI } from '../infrastructures/compilanceAPI'
import { pollingTransactionStatus } from '../utils/pollingTransactionStatus'
import type { CheckTransactionsService } from '../services/checkTransactions'

export class ReverseTransactionUseCase {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly compilanceAPI: CompilanceAPI,
    private readonly checkTransactionsService: CheckTransactionsService,
  ) {}
  async execute(accountId: string, transactionId: string, userId: string) {
    try {
      const registeredAccount = await this.accountsRepository.findByAccountId(accountId)

      if (!registeredAccount || registeredAccount.userId !== userId) {
        throw new ForbiddenError(
          'Access denied. This account does not belong to the authenticated user.',
        )
      }

      const registeredTransaction =
        await this.transactionsRepository.findByAccountIdAndtransactionId(
          accountId,
          transactionId,
        )

      if (!registeredTransaction) {
        throw new BadRequestError('Non-existent transaction.')
      }

      if (registeredTransaction.isReverted) {
        throw new ConflictError('Transaction already reverted.')
      }

      let registerRevertedTransaction

      const { relatedTransactionId } = registeredTransaction

      if (relatedTransactionId) {
        registerRevertedTransaction = await this.reverseInternal(
          relatedTransactionId,
          accountId,
          userId,
        )
      } else {
        registerRevertedTransaction = await this.reverse(
          registeredTransaction,
          accountId,
          userId,
        )
      }

      const absoluteAmountRefunded = convertCentsToReais(
        registerRevertedTransaction.value,
      )

      const registeredRevertedTransaction = {
        id: registerRevertedTransaction.id,
        value: convertAbsoluteAmountToAmount(
          absoluteAmountRefunded,
          registerRevertedTransaction.type,
        ),
        description: registerRevertedTransaction.description,
        createdAt: registerRevertedTransaction.createdAt,
        updatedAt: registerRevertedTransaction.updatedAt,
      }
      return registeredRevertedTransaction
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new InternalServerError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message || 'Error reversing transaction.',
      )
    }
  }

  private async reverse(
    registeredTransaction: Transactions,
    accountId: string,
    userId: string,
  ) {
    const { empontentId } = registeredTransaction

    if (!empontentId)
      throw new BadRequestError('There is no registered empontentId for the transaction.')

    await this.checkTransactionsService.execute(accountId, userId)

    const updatedRegisteredTransaction = await this.transactionsRepository.findById(
      registeredTransaction.id,
    )

    if (updatedRegisteredTransaction!.status !== TransactionStatus.authorized) {
      throw new ConflictError('Unable to reverse transaction as it was not processed.')
    }

    if (updatedRegisteredTransaction!.isReverted) {
      throw new ConflictError('Transaction already reverted.')
    }

    const revertedTransactionType = invertTransactionType(
      updatedRegisteredTransaction!.type,
    )

    const valueToBeRefunded = convertAbsoluteAmountToAmount(
      updatedRegisteredTransaction!.value,
      revertedTransactionType,
    )

    const updatedRegisteredAccount =
      await this.accountsRepository.findByAccountId(accountId)

    const balanceUpdated = updatedRegisteredAccount!.balance + valueToBeRefunded

    if (balanceUpdated < 0) {
      throw new PaymentRequiredError('Insufficient balance.')
    }

    const newTransactionId = uuid()

    const registerRevertedTransaction = await this.transactionsRepository.create({
      id: newTransactionId,
      value: updatedRegisteredTransaction!.value,
      type: revertedTransactionType,
      description: updatedRegisteredTransaction!.description,
      accountId,
      reversedById: updatedRegisteredTransaction!.id,
      status: TransactionStatus.requested,
    })

    const empontentIdToRevertTransaction = uuid()

    try {
      await this.compilanceAPI.createTransaction(empontentIdToRevertTransaction, {
        description: updatedRegisteredTransaction!.description,
        externalId: newTransactionId,
      })
    } catch {
      throw new BadRequestError('Unable to request transaction.')
    }

    const statusTransaction = await pollingTransactionStatus(empontentId, () =>
      this.compilanceAPI.getTransactionById(empontentId),
    )

    await this.transactionsRepository.updateStatusAndBalance(
      accountId,
      newTransactionId,
      statusTransaction,
      statusTransaction === TransactionStatus.authorized ? balanceUpdated : null,
    )

    if (statusTransaction === TransactionStatus.unauthorized) {
      throw new PaymentRequiredError('Payment refused by Compilance API.')
    }
    return registerRevertedTransaction
  }

  private async reverseInternal(
    relatedTransactionId: string,
    ownerAccountId: string,
    ownerUserId: string,
  ) {
    const listOfTransactionsToReverse =
      await this.transactionsRepository.findByRelatedTransactionId(relatedTransactionId)

    if (listOfTransactionsToReverse.length !== 2) {
      throw new BadRequestError(
        'Internal transactions related to this transaction not found.',
      )
    }

    const transactionAccountOwner = listOfTransactionsToReverse.find(
      (i) => i.accountId === ownerAccountId,
    )

    const transactionAccountReceiver = listOfTransactionsToReverse.find(
      (i) => i.accountId !== ownerAccountId,
    )

    if (!transactionAccountOwner || !transactionAccountReceiver) {
      throw new BadRequestError("The owner's account is not related to this transaction.")
    }

    const registeredAccountReceiver = await this.accountsRepository.findByAccountId(
      transactionAccountReceiver.accountId,
    )

    await Promise.allSettled([
      this.checkTransactionsService.execute(ownerAccountId, ownerUserId),
      this.checkTransactionsService.execute(
        transactionAccountReceiver.accountId,
        registeredAccountReceiver!.userId,
      ),
    ])

    const [updatedRegisteredAccountOwner, updatedRegisteredAccountReceiver] =
      await Promise.all([
        this.accountsRepository.findByAccountId(ownerAccountId),
        this.accountsRepository.findByAccountId(transactionAccountReceiver.accountId),
      ])

    const isDebit = transactionAccountOwner.type === TransactionType.debit
    const value = transactionAccountOwner.value

    const balanceCurrentOwner = isDebit
      ? updatedRegisteredAccountOwner!.balance - value
      : updatedRegisteredAccountOwner!.balance + value

    const balanceCurrentReceiver = isDebit
      ? updatedRegisteredAccountReceiver!.balance + value
      : updatedRegisteredAccountReceiver!.balance - value

    if (balanceCurrentOwner < 0) {
      throw new PaymentRequiredError("Insufficient balance in the owner's account.")
    }

    if (balanceCurrentReceiver < 0) {
      throw new PaymentRequiredError("Insufficient balance in the receiver's account.")
    }

    const newRelatedTransactionId = uuid()

    const transactionOwnerAccount = {
      id: uuid(),
      value: transactionAccountOwner.value,
      type: invertTransactionType(transactionAccountOwner.type),
      description: transactionAccountOwner.description,
      accountId: transactionAccountOwner.accountId,
      reversedById: transactionAccountOwner.id,
      relatedTransactionId: newRelatedTransactionId,
      status: TransactionStatus.authorized,
    }

    const transactionReceiverAccount = {
      id: uuid(),
      value: transactionAccountReceiver.value,
      type: invertTransactionType(transactionAccountReceiver.type),
      description: transactionAccountReceiver.description,
      accountId: transactionAccountReceiver.accountId,
      reversedById: transactionAccountReceiver.id,
      relatedTransactionId: newRelatedTransactionId,
      status: TransactionStatus.authorized,
    }

    const registeredTransaction = await this.transactionsRepository.revertInternal(
      transactionOwnerAccount,
      transactionReceiverAccount,
      balanceCurrentOwner,
      balanceCurrentReceiver,
      relatedTransactionId,
    )

    return registeredTransaction
  }
}
