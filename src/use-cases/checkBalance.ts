import type { AccountsRepository } from '../repositories/accounts'
import { AppError, ForbiddenError, InternalServerError } from '../err/appError'
import { convertCentsToReais } from '../utils/moneyConverter'
export class CheckBalanceUseCase {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async execute(accountId: string, userId: string): Promise<{ balance: number }> {
    try {
      const registeredAccount = await this.accountsRepository.findByAccountId(accountId)

      if (!registeredAccount || registeredAccount.userId !== userId) {
        throw new ForbiddenError(
          'Access denied. This account does not belong to the authenticated user.',
        )
      }

      const balance = {
        balance: convertCentsToReais(registeredAccount.balance),
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
