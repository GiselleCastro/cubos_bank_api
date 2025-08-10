import { ListOfCardsByAccountUseCase } from '../listOfCardsByAccount'
import { AccountsRepositoryFactory } from '../../repositories/factories/accounts.factory'

export class ListOfCardsByAccountUseCaseFactory {
  static make(): ListOfCardsByAccountUseCase {
    const repository = AccountsRepositoryFactory.make()
    return new ListOfCardsByAccountUseCase(repository)
  }
}
