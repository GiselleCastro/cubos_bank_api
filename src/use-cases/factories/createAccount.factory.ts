import { CreateAccountUseCase } from '../createAccount'
import { AccountsRepositoryFactory } from '../../repositories/factories/accounts.factory'

export class CreateAccountUseCaseFactory {
  static make(): CreateAccountUseCase {
    const repository = AccountsRepositoryFactory.make()
    return new CreateAccountUseCase(repository)
  }
}
