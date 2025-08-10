import { TransactionsController } from '../transactions.controller'
import { ListOfAllTransactionsUseCaseFactory } from '../../use-cases/factories/listOfAllTransactions.factory'
import { CreateTransactionUseCaseFactory } from '../../use-cases/factories/createTransaction.factory'
import { CreateInternalTransferUseCaseFactory } from '../../use-cases/factories/createInternalTransfer.factory'
import { ReverseTransactionUseCaseFactory } from '../../use-cases/factories/reverseTransaction.factory'

export class TransactionsControllerFactory {
  static make(): TransactionsController {
    const listOfAllTransactions = ListOfAllTransactionsUseCaseFactory.make()
    const createTransaction = CreateTransactionUseCaseFactory.make()
    const createInternalTransfer = CreateInternalTransferUseCaseFactory.make()
    const reverseTransaction = ReverseTransactionUseCaseFactory.make()
    return new TransactionsController(
      createTransaction,
      listOfAllTransactions,
      createInternalTransfer,
      reverseTransaction,
    )
  }
}
