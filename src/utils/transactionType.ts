import { TransactionType } from '@prisma/client'

export const invertTransactionType = (type: TransactionType): TransactionType => {
  return type === TransactionType.credit ? TransactionType.debit : TransactionType.credit
}

export const inferTransactionType = (value: number): TransactionType => {
  return value >= 0 ? TransactionType.credit : TransactionType.debit
}
