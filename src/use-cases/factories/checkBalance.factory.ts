import { CheckBalanceUseCase } from '../checkBalance'
import { AccountsRepositoryFactory } from '../../repositories/factories/accounts.factory'

export class CheckBalanceUseCaseFactory {
  static make(): CheckBalanceUseCase {
    const repository = AccountsRepositoryFactory.make()
    return new CheckBalanceUseCase(repository)
  }
}
