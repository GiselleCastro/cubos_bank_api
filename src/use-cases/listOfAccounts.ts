import { AppError, InternalServerError } from '../err/appError'
import type { AccountsRepository } from '../repositories/accounts'
import type { AccountType } from '../types/accounts'

export class ListOfAccountsUseCase {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async execute(userId: string): Promise<AccountType[]> {
    try {
      const accountsRegistered = await this.accountsRepository.findByUserId(userId)
      return accountsRegistered
    } catch (error) {
      if (error instanceof AppError) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new InternalServerError((error as any)?.message || 'Error listing accounts.')
    }
  }
}
