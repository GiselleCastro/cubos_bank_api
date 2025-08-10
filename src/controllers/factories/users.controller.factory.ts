import { UsersController } from '../users.controller'
import { LoginUseCaseFactory } from '../../use-cases/factories/login.factory'
import { CreateUserCaseFactory } from '../../use-cases/factories/createUser.factory'

export class UsersControllerFactory {
  static make(): UsersController {
    const loginCase = LoginUseCaseFactory.make()
    const createUserCase = CreateUserCaseFactory.make()

    return new UsersController(createUserCase, loginCase)
  }
}
