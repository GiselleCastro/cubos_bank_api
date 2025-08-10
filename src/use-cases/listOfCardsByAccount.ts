import type { AccountsRepository } from '../repositories/accounts'
import { AppError, ForbiddenError, InternalServerError } from '../err/appError'
import { reverterTokenCard } from '../utils/cardToken'

export class ListOfCardsByAccountUseCase {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async execute(accountId: string, userId: string) {
    try {
      const registeredAccount = await this.accountsRepository.findByAccountId(accountId)
      if (registeredAccount?.userId !== userId) {
        throw new ForbiddenError(
          'Access denied. This account does not belong to the authenticated user.',
        )
      }
      const cardsByAccount =
        await this.accountsRepository.listOfCardsByAccountId(accountId)

      const cardsByAccountDisplay = cardsByAccount?.map((i) => {
        const { cardNumber, cvv } = reverterTokenCard(i.blob)

        return {
          id: i.id,
          type: i.type,
          number: cardNumber,
          cvv: cvv,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        }
      })

      return cardsByAccountDisplay
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new InternalServerError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message || `Error listing cards for accountId ${accountId}.`,
      )
    }
  }
}
