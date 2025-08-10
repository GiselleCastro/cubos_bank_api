import { z } from 'zod'
import { createCardBodySchema } from '../schema/accounts'
import { Pagination } from '.'
import { CardType } from '@prisma/client'

export type CreateCardData = z.infer<typeof createCardBodySchema>

type CardBase = {
  id: string
  blob: Uint8Array<ArrayBufferLike>
  type: CardType
  last4: string
}

export type CreateCard = CardBase & {
  token: string
  accountId: string
}

export type ListCardReturn = CardBase & {
  createdAt: Date
  updatedAt: Date
}

export type CreateCardReturn = CreateCardData & {
  id: string
  createdAt: Date
  updatedAt: Date
}

type CardInfo = CreateCardData & {
  id: string
  createdAt: Date
  updatedAt: Date
}

export type PaginationByUser = Pagination & {
  userId: string
}

export type CardsReturnPagination = {
  cards: CardInfo[]
  pagination: Pagination
}
