import { PrismaClient } from '@prisma/client'
import type { Users } from '@prisma/client'
import type { CreateUser } from '../types/users'

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUser): Promise<Users> {
    return this.prisma.users.create({ data })
  }

  async findByDocument(document: string): Promise<Users | null> {
    return this.prisma.users.findUnique({ where: { document } })
  }
}
