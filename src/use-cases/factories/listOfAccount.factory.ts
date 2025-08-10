import { ListOfAccountsUseCase } from '../listOfAccounts'
import { AccountsRepositoryFactory } from '../../repositories/factories/accounts.factory'

export class ListOfAccountsUseCaseFactory {
  static make(): ListOfAccountsUseCase {
    const repository = AccountsRepositoryFactory.make()
    return new ListOfAccountsUseCase(repository)
  }
}
