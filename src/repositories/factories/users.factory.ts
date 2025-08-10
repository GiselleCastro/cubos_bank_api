import { UsersRepository } from '../users'
import { prisma } from '../../prisma/client'

export class UsersRepositoryFactory {
  static make(): UsersRepository {
    return new UsersRepository(prisma)
  }
}
