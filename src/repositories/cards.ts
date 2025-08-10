import { PrismaClient } from '@prisma/client'
import type { Cards, CardType } from '@prisma/client'
import type { CreateCard } from '../types/cards'

export class CardsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateCard): Promise<Cards> {
    return this.prisma.cards.create({ data })
  }

  async findByToken(token: string): Promise<Cards | null> {
    return this.prisma.cards.findUnique({ where: { token } })
  }

  async findByAccountIdAndType(accountId: string, type: CardType): Promise<Cards | null> {
    return this.prisma.cards.findFirst({ where: { accountId: accountId, type } })
  }

  async findByUserId(userId: string, skip: number, take: number) {
    return this.prisma.cards.findMany({
      select: {
        id: true,
        type: true,
        last4: true,
        blob: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        account: {
          user: {
            id: userId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    })
  }
}
