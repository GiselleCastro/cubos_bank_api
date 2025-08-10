import { CheckBalanceUseCase } from '../checkBalance'
import { AccountsRepositoryFactory } from '../../repositories/factories/accounts.factory'
import { CheckTransactionsServiceFactory } from '../../services/factories/checkTransactios.factory'

export class CheckBalanceUseCaseFactory {
  static make(): CheckBalanceUseCase {
    const accounts = AccountsRepositoryFactory.make()
    const checkTransaction = CheckTransactionsServiceFactory.make()

    return new CheckBalanceUseCase(accounts, checkTransaction)
  }
}
