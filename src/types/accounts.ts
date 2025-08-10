import { z } from 'zod'
import { createAccountBodySchema } from '../schema/accounts'

export type CreateAccountData = z.infer<typeof createAccountBodySchema>

export type AccountReturn = CreateAccountData & {
  id: string
  createdAt: Date
  updatedAt: Date
}

export type AccountType = AccountReturn

export type CreateAccount = {
  id: string
  branch: string
  account: string
  userId: string
}
