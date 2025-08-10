import { TransactionType } from '@prisma/client'

const reaisInCents = 100

export const convertReaisToCents = (valueInReais: number) => {
  return valueInReais * reaisInCents
}

export const convertCentsToReais = (valueInCents: number) => {
  return valueInCents / reaisInCents
}

export const convertAbsoluteAmountToAmount = (value: number, type: TransactionType) => {
  return type === TransactionType.credit ? value : -value
}
