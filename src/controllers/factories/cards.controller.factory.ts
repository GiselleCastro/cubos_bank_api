import { CardsController } from '../cards.controller'
import { ListOfCardsUseCaseFactory } from '../../use-cases/factories/listOfCards.factory'

export class CardsControllerFactory {
  static make(): CardsController {
    const listOfCards = ListOfCardsUseCaseFactory.make()
    return new CardsController(listOfCards)
  }
}
