import { CreateInternalTransferUseCase } from '../createInternalTransfer'
import { AccountsRepositoryFactory } from '../../repositories/factories/accounts.factory'
import { TransactionsRepositoryFactory } from '../../repositories/factories/transactions.factory'
import { CheckTransactionsServiceFactory } from '../../services/factories/checkTransactios.factory'

export class CreateInternalTransferUseCaseFactory {
  static make(): CreateInternalTransferUseCase {
    const transactions = TransactionsRepositoryFactory.make()
    const accounts = AccountsRepositoryFactory.make()
    const checkTransactions = CheckTransactionsServiceFactory.make()

    return new CreateInternalTransferUseCase(accounts, transactions, checkTransactions)
  }
}
