import { ListOfAllTransactionsUseCase } from '../listOfAllTransactions'
import { TransactionsRepositoryFactory } from '../../repositories/factories/transactions.factory'
import { AccountsRepositoryFactory } from '../../repositories/factories/accounts.factory'
import { CheckTransactionsServiceFactory } from '../../services/factories/checkTransactios.factory'

export class ListOfAllTransactionsUseCaseFactory {
  static make(): ListOfAllTransactionsUseCase {
    const transactions = TransactionsRepositoryFactory.make()
    const accounts = AccountsRepositoryFactory.make()
    const checkTransactions = CheckTransactionsServiceFactory.make()

    return new ListOfAllTransactionsUseCase(transactions, accounts, checkTransactions)
  }
}
