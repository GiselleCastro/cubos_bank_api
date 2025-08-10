import { PrismaClient } from '@prisma/client'
import type { Accounts } from '@prisma/client'
import type { ListCardReturn } from '../types/cards'
import type { CreateAccount, AccountReturn } from '../types/accounts'

export class AccountsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateAccount): Promise<Accounts> {
    return this.prisma.accounts.create({ data })
  }

  async findByUserId(userId: string): Promise<AccountReturn[]> {
    return this.prisma.accounts.findMany({
      select: {
        id: true,
        branch: true,
        account: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { userId },
    })
  }

  async findByAccountId(accountId: string): Promise<Accounts | null> {
    return this.prisma.accounts.findUnique({ where: { id: accountId } })
  }

  async listOfCardsByAccountId(accountId: string): Promise<ListCardReturn[] | null> {
    return this.prisma.cards.findMany({
      select: {
        id: true,
        type: true,
        last4: true,
        blob: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { accountId },
    })
  }

  async findByAccountNumberAndBranch(
    account: string,
    branch: string,
  ): Promise<Accounts | null> {
    return this.prisma.accounts.findFirst({ where: { account, branch } })
  }
}
