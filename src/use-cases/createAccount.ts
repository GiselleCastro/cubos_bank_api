import type { AccountsRepository } from '../repositories/accounts'
import { AppError, BadRequestError, InternalServerError } from '../err/appError'
import type { CreateAccountData, AccountReturn } from '../types/accounts'
import { v4 as uuid } from 'uuid'

export class CreateAccountUseCase {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async execute(data: CreateAccountData, userId: string): Promise<AccountReturn> {
    try {
      const registeredAccount =
        await this.accountsRepository.findByAccountNumberAndBranch(
          data.account,
          data.branch,
        )

      if (registeredAccount) {
        throw new BadRequestError('Account already registered.')
      }

      const newAccount = await this.accountsRepository.create({
        id: uuid(),
        ...data,
        userId,
      })

      const newAccountCreated = {
        id: newAccount.id,
        branch: newAccount.branch,
        account: newAccount.account,
        createdAt: newAccount.createdAt,
        updatedAt: newAccount.updatedAt,
      }

      return newAccountCreated
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new InternalServerError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message || 'Error in the process of creating a account.',
      )
    }
  }
}
