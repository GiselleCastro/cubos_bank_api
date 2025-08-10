import type { CardsRepository } from '../repositories/cards'
import {
  AppError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
} from '../err/appError'
import type { CreateCardData, CreateCardReturn } from '../types/cards'
import { v4 as uuid } from 'uuid'
import { CardType } from '@prisma/client'
import type { AccountsRepository } from '../repositories/accounts'
import { cardTokenizer } from '../utils/cardToken'

export class CreateCardUseCase {
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly accountsRepository: AccountsRepository,
  ) {}

  async execute(
    data: CreateCardData,
    accountId: string,
    userId: string,
  ): Promise<CreateCardReturn> {
    data.number = data.number.replace(/\D/g, '')

    try {
      const registeredAccount = await this.accountsRepository.findByAccountId(accountId)
      if (registeredAccount?.userId !== userId) {
        throw new ForbiddenError(
          'Access denied. This account does not belong to the authenticated user.',
        )
      }

      if (data.type == CardType.physical) {
        const registeredCard = await this.cardsRepository.findByAccountIdAndType(
          accountId,
          data.type,
        )

        if (registeredCard) {
          throw new ConflictError('There is already a physical card for this account')
        }
      }

      const { token, blob } = cardTokenizer(data.number, data.cvv)

      const registeredCard = await this.cardsRepository.findByToken(token)

      if (registeredCard) {
        throw new ConflictError('This card already exists.')
      }

      const lastFourDigits = data.number.slice(-4)

      const newCard = await this.cardsRepository.create({
        id: uuid(),
        token,
        blob,
        last4: lastFourDigits,
        accountId,
        type: data.type,
      })

      const newCardCreated = {
        id: newCard.id,
        type: data.type,
        number: lastFourDigits,
        cvv: data.cvv,
        createdAt: newCard.createdAt,
        updatedAt: newCard.updatedAt,
      }

      return newCardCreated
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new InternalServerError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message || 'Error in the process of creating a card.',
      )
    }
  }
}
