import {
  PrismaClient,
  Transactions,
  TransactionStatus,
  TransactionType,
} from '@prisma/client'
import type { CreateTransaction, RevertTransaction } from '../types/transactions'

export class TransactionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateTransaction, balance: number | null): Promise<Transactions> {
    if (balance !== null) {
      const [transaction] = await this.prisma.$transaction([
        this.prisma.transactions.create({ data }),
        this.prisma.accounts.update({
          where: { id: data.accountId },
          data: {
            balance,
          },
        }),
      ])
      return transaction
    }
    return this.prisma.transactions.create({ data })
  }

  async revert(data: RevertTransaction, balance: number | null): Promise<Transactions> {
    if (balance !== null) {
      const [transaction] = await this.prisma.$transaction([
        this.prisma.transactions.create({ data }),
        this.prisma.transactions.update({
          where: { id: data.reversedById },
          data: {
            isReverted: true,
          },
        }),
        this.prisma.accounts.update({
          where: { id: data.accountId },
          data: {
            balance,
          },
        }),
      ])

      return transaction
    }
    return this.prisma.transactions.create({ data })
  }

  async revertInternal(
    transactionOwnerAccount: RevertTransaction,
    transactionReceiverAccount: RevertTransaction,
    balanceOwner: number,
    balanceReceiver: number,
    relatedTransactionId: string,
  ): Promise<Transactions> {
    const [transactionInternalOwnerAccount] = await this.prisma.$transaction([
      this.prisma.transactions.create({ data: transactionOwnerAccount }),
      this.prisma.transactions.create({ data: transactionReceiverAccount }),
      this.prisma.accounts.update({
        where: { id: transactionOwnerAccount.accountId },
        data: {
          balance: balanceOwner,
        },
      }),
      this.prisma.accounts.update({
        where: { id: transactionReceiverAccount.accountId },
        data: {
          balance: balanceReceiver,
        },
      }),
      this.prisma.transactions.updateMany({
        where: { relatedTransactionId },
        data: {
          isReverted: true,
        },
      }),
    ])

    return transactionInternalOwnerAccount
  }

  async createInternal(
    transactionOwnerAccount: CreateTransaction,
    transactionReceiverAccount: CreateTransaction,
    balanceOwner: number,
    balanceReceiver: number,
  ): Promise<Transactions> {
    const [transactionInternalOwnerAccount] = await this.prisma.$transaction([
      this.prisma.transactions.create({ data: transactionOwnerAccount }),
      this.prisma.transactions.create({ data: transactionReceiverAccount }),
      this.prisma.accounts.update({
        where: { id: transactionOwnerAccount.accountId },
        data: {
          balance: balanceOwner,
        },
      }),
      this.prisma.accounts.update({
        where: { id: transactionReceiverAccount.accountId },
        data: {
          balance: balanceReceiver,
        },
      }),
    ])

    return transactionInternalOwnerAccount
  }

  async findByAccountId(
    accountId: string,
    skip: number,
    take: number,
    type: TransactionType | null = null,
  ) {
    return this.prisma.transactions.findMany({
      where: {
        accountId,
        ...(type && { type }),
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findById(transactionId: string) {
    return this.prisma.transactions.findUnique({
      where: {
        id: transactionId,
      },
    })
  }

  async findAllByAccountIdAndStatusProcessingAndWithEmpontentId(accountId: string) {
    return this.prisma.transactions.findMany({
      where: {
        accountId,
        status: TransactionStatus.processing,
        empontentId: {
          not: null,
        },
      },
      orderBy: [
        {
          type: 'desc',
        },
        {
          createdAt: 'asc',
        },
      ],
    })
  }

  async findByRelatedTransactionId(relatedTransactionId: string) {
    return this.prisma.transactions.findMany({
      where: {
        relatedTransactionId,
      },
    })
  }

  async findByAccountIdAndtransactionId(accountId: string, transactionId: string) {
    return this.prisma.transactions.findUnique({
      where: {
        id: transactionId,
        accountId,
      },
    })
  }

  async updateStatusAndBalance(
    accountId: string,
    transactionId: string,
    status: TransactionStatus,
    balance: number,
    reversedById: string | null,
  ) {
    if (!reversedById) {
      return this.prisma.$transaction([
        this.prisma.accounts.update({
          where: { id: accountId },
          data: { balance },
        }),
        this.prisma.transactions.update({
          where: {
            id: transactionId,
          },
          data: { status },
        }),
      ])
    }

    return this.prisma.$transaction([
      this.prisma.accounts.update({
        where: { id: accountId },
        data: { balance },
      }),
      this.prisma.transactions.update({
        where: {
          id: transactionId,
        },
        data: { status },
      }),
      this.prisma.transactions.update({
        where: { id: reversedById },
        data: {
          isReverted: true,
        },
      }),
    ])
  }
}
