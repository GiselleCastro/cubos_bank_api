import { CreateCardUseCase } from '../createCard'
import { CardsRepositoryFactory } from '../../repositories/factories/cards.factory'
import { AccountsRepositoryFactory } from '../../repositories/factories/accounts.factory'
export class CreateCardUseCaseFactory {
  static make(): CreateCardUseCase {
    const cards = CardsRepositoryFactory.make()
    const accounts = AccountsRepositoryFactory.make()
    return new CreateCardUseCase(cards, accounts)
  }
}
