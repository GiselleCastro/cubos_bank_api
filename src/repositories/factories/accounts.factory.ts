import { AccountsRepository } from '../accounts'
import { prisma } from '../../prisma/client'

export class AccountsRepositoryFactory {
  static make(): AccountsRepository {
    return new AccountsRepository(prisma)
  }
}
