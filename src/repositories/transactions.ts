import {
  PrismaClient,
  Transactions,
  TransactionStatus,
  TransactionType,
} from '@prisma/client'
import type { CreateTransaction } from '../types/transactions'

export class TransactionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateTransaction): Promise<Transactions> {
    return this.prisma.transactions.create({ data })
  }

  async revertInternal(
    transactionOwnerAccount: CreateTransaction,
    transactionReceiverAccount: CreateTransaction,
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
        status: {
          not: TransactionStatus.requested,
        },
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

  async findAllByAccountIdAndNotStatusAuthorizedProcessingAndWithEmpontentId(
    accountId: string,
  ) {
    return this.prisma.transactions.findMany({
      where: {
        accountId,
        status: {
          not: TransactionStatus.authorized,
        },
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
    balance: number | null = null,
    reversedById: string | null = null,
  ) {
    if (!balance) {
      return this.prisma.$transaction([
        this.prisma.transactions.update({
          where: {
            id: transactionId,
          },
          data: { status },
        }),
      ])
    }

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
