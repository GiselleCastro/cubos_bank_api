import { CreateUserUseCase } from '../createUser'
import { UsersRepositoryFactory } from '../../repositories/factories/users.factory'
import { CompilanceAPIFactory } from '../../infrastructures/factories/compilanceAPI.factory'

export class CreateUserCaseFactory {
  static make(): CreateUserUseCase {
    const repository = UsersRepositoryFactory.make()
    const api = CompilanceAPIFactory.make()
    return new CreateUserUseCase(repository, api)
  }
}
