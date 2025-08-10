import { CardsRepository } from '../cards'
import { prisma } from '../../prisma/client'

export class CardsRepositoryFactory {
  static make(): CardsRepository {
    return new CardsRepository(prisma)
  }
}
