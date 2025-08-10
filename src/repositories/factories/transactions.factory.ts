import { TransactionsRepository } from '../transactions'
import { prisma } from '../../prisma/client'

export class TransactionsRepositoryFactory {
  static make(): TransactionsRepository {
    return new TransactionsRepository(prisma)
  }
}
