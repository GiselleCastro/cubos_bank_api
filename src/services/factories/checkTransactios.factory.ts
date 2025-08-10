import { CheckTransactionsService } from '../checkTransactions'
import { TransactionsRepositoryFactory } from '../../repositories/factories/transactions.factory'
import { AccountsRepositoryFactory } from '../../repositories/factories/accounts.factory'
import { CompilanceAPIFactory } from '../../infrastructures/factories/compilanceAPI.factory'

export class CheckTransactionsServiceFactory {
  static make(): CheckTransactionsService {
    const transactions = TransactionsRepositoryFactory.make()
    const accounts = AccountsRepositoryFactory.make()
    const compilanceAPI = CompilanceAPIFactory.make()

    return new CheckTransactionsService(transactions, accounts, compilanceAPI)
  }
}
