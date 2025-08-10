import { ListOfCardsUseCase } from '../listOfCards'
import { CardsRepositoryFactory } from '../../repositories/factories/cards.factory'

export class ListOfCardsUseCaseFactory {
  static make(): ListOfCardsUseCase {
    const repository = CardsRepositoryFactory.make()
    return new ListOfCardsUseCase(repository)
  }
}
