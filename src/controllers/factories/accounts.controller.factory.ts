import { AccountsController } from '../accounts.controller'
import { CreateAccountUseCaseFactory } from '../../use-cases/factories/createAccount.factory'
import { ListOfAccountsUseCaseFactory } from '../../use-cases/factories/listOfAccount.factory'
import { CreateCardUseCaseFactory } from '../../use-cases/factories/createCard.factory'
import { CheckBalanceUseCaseFactory } from '../../use-cases/factories/checkBalance.factory'
import { ListOfCardsByAccountUseCaseFactory } from '../../use-cases/factories/listOfCardsByAccount.factory'

export class AccountsControllerFactory {
  static make(): AccountsController {
    const createAccount = CreateAccountUseCaseFactory.make()
    const listOfAccounts = ListOfAccountsUseCaseFactory.make()
    const createCard = CreateCardUseCaseFactory.make()
    const checkBalance = CheckBalanceUseCaseFactory.make()
    const listOfCardsByAccount = ListOfCardsByAccountUseCaseFactory.make()
    return new AccountsController(
      createAccount,
      listOfAccounts,
      createCard,
      checkBalance,
      listOfCardsByAccount,
    )
  }
}
