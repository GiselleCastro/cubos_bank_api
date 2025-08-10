import type { TransactionsRepository } from '../repositories/transactions'
import { AppError, ForbiddenError, InternalServerError } from '../err/appError'
import type {
  PaginationByTransaction,
  TransactionsReturnPagination,
} from '../types/transactions'
import {
  convertAbsoluteAmountToAmount,
  convertCentsToReais,
} from '../utils/moneyConverter'
import type { AccountsRepository } from '../repositories/accounts'
import type { CheckTransactionsService } from '../services/checkTransactions'
export class ListOfAllTransactionsUseCase {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly checkTransactionsService: CheckTransactionsService,
  ) {}

  async execute({
    accountId,
    userId,
    itemsPerPage = 10,
    currentPage = 1,
    type,
  }: PaginationByTransaction): Promise<TransactionsReturnPagination> {
    try {
      const registeredAccount = await this.accountsRepository.findByAccountId(accountId)
      if (!registeredAccount || registeredAccount.userId !== userId) {
        throw new ForbiddenError(
          'Access denied. This account does not belong to the authenticated user.',
        )
      }

      await this.checkTransactionsService.execute(accountId, userId)

      const skip = (currentPage - 1) * itemsPerPage
      const take = itemsPerPage

      const listOfAllTransactions = await this.transactionsRepository.findByAccountId(
        accountId,
        skip,
        take,
        type,
      )

      const listOfAllTransactionsDisplay = listOfAllTransactions.map((i) => {
        const absoluteValueInReaisOfTheTransaction = convertCentsToReais(i.value)
        return {
          id: i.id,
          value: convertAbsoluteAmountToAmount(
            absoluteValueInReaisOfTheTransaction,
            i.type,
          ),
          description: i.description,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        }
      })

      const pagination = {
        itemsPerPage,
        currentPage,
      }

      return { transactions: listOfAllTransactionsDisplay, pagination }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new InternalServerError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message || 'Error checking balance.',
      )
    }
  }
}
