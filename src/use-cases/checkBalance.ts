import type { AccountsRepository } from '../repositories/accounts'
import { AppError, ForbiddenError, InternalServerError } from '../err/appError'
import { convertCentsToReais } from '../utils/moneyConverter'
import { CheckTransactionsService } from '../services/checkTransactions'

export class CheckBalanceUseCase {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly checkTransactionsService: CheckTransactionsService,
  ) {}

  async execute(accountId: string, userId: string): Promise<{ balance: number }> {
    try {
      const registeredAccount = await this.accountsRepository.findByAccountId(accountId)

      if (!registeredAccount || registeredAccount.userId !== userId) {
        throw new ForbiddenError(
          'Access denied. This account does not belong to the authenticated user.',
        )
      }

      await this.checkTransactionsService.execute(accountId, userId)

      const updatedRegisteredAccount =
        await this.accountsRepository.findByAccountId(accountId)

      const balance = {
        balance: convertCentsToReais(updatedRegisteredAccount!.balance),
      }

      return balance
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new InternalServerError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message || 'Error checking balance.',
      )
    }
  }
}
