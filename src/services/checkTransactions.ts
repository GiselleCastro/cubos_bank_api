import type { TransactionsRepository } from '../repositories/transactions'
import { AppError, ForbiddenError, InternalServerError } from '../err/appError'
import { convertAbsoluteAmountToAmount } from '../utils/moneyConverter'
import type { AccountsRepository } from '../repositories/accounts'
import type { CompilanceAPI } from '../infrastructures/compilanceAPI'
import { TransactionStatus } from '@prisma/client'

export class CheckTransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly compilanceAPI: CompilanceAPI,
  ) {}

  async execute(accountId: string, userId: string): Promise<void> {
    try {
      const registeredAccount = await this.accountsRepository.findByAccountId(accountId)
      if (!registeredAccount || registeredAccount.userId !== userId) {
        throw new ForbiddenError(
          'Access denied. This account does not belong to the authenticated user.',
        )
      }

      const listOfAllTransactionsCurrentStatusProcessingAndWithEmpontentId =
        await this.transactionsRepository.findAllByAccountIdAndNotStatusAuthorizedProcessingAndWithEmpontentId(
          accountId,
        )

      const allTransactionByCompilanceAPI = await this.compilanceAPI.getAllTransaction()

      listOfAllTransactionsCurrentStatusProcessingAndWithEmpontentId.forEach(
        async (i) => {
          const status = allTransactionByCompilanceAPI.find(
            (j) => i.id === j.externalId,
          )?.status
          if (!status) return
          if (status === TransactionStatus.authorized) {
            try {
              const accountToBeUpdate = await this.accountsRepository.findByAccountId(
                i.accountId,
              )
              if (!accountToBeUpdate) return
              const newBalance =
                accountToBeUpdate.balance + convertAbsoluteAmountToAmount(i.value, i.type)
              if (newBalance > 0) {
                await this.transactionsRepository.updateStatusAndBalance(
                  i.accountId,
                  i.id,
                  status,
                  newBalance,
                  i.reversedById,
                )
              }
            } catch {
              return
            }
          } else {
            await this.transactionsRepository.updateStatusAndBalance(
              i.accountId,
              i.id,
              status,
            )
          }
        },
      )

      const DB_PROPAGATION_DELAY_MS = 100
      await new Promise((_) => setTimeout(_, DB_PROPAGATION_DELAY_MS))
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new InternalServerError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message || 'Error checking balance.',
      )
    }
  }
}
