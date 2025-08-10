import type { Express } from 'express'
import { buildServer } from '../../src/app'
import request from 'supertest'
import { faker } from '@faker-js/faker'
import { HttpStatusCode } from 'axios'
import { ListOfCardsUseCase } from '../../src/use-cases/listOfCards'
import { CardsRepository } from '../../src/repositories/cards'
import { InternalServerError } from '../../src/err/appError'
import { CardType } from '@prisma/client'
import { CreateCardReturn } from '../../src/types/cards'
import { cardTokenizer } from '../../src/utils/cardToken'

const userId = faker.string.uuid()

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((_, __) => {
    return { id: userId }
  }),
}))
jest.mock('../../src/repositories/cards')

describe('GET /cards', () => {
  let serverStub: Express

  beforeAll(async () => {
    serverStub = await buildServer()
  })

  afterAll(async () => {})

  it('should return 200 and the list of cards', async () => {
    const mockCards: CreateCardReturn[] = []
    const numberOfCards = faker.number.int({ min: 30, max: 40 })

    for (let i = 0; i < numberOfCards; i++) {
      mockCards.push({
        id: faker.string.uuid(),
        type: CardType.virtual,
        number: faker.finance.creditCardNumber().replace(/\D/g, ''),
        cvv: faker.finance.creditCardCVV(),
        createdAt: faker.date.anytime(),
        updatedAt: faker.date.anytime(),
      })
    }

    const pagination = {
      itemsPerPage: faker.number.int({ min: 1, max: 5 }),
      currentPage: faker.number.int({ min: 1, max: 2 }),
    }

    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    const cardsOnTheCurrentPage = mockCards.slice(startIndex, endIndex)

    const cardsOnTheCurrentPageTonkenized = cardsOnTheCurrentPage.map((i) => {
      const { token, blob } = cardTokenizer(i.number, i.cvv)
      return {
        id: i.id,
        token,
        blob,
        last4: i.number.slice(-4),
        type: i.type,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      }
    })

    const cardsRepositoryFindByUserIdSpy = jest
      .spyOn(CardsRepository.prototype, 'findByUserId')
      .mockResolvedValue(cardsOnTheCurrentPageTonkenized)

    const listCardsPaginationDateToStringAndLastFourDigitsCard =
      cardsOnTheCurrentPage.map((i) => ({
        ...i,
        number: i.number.slice(-4),
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      }))

    const listCardsPaginationDisplay = {
      cards: listCardsPaginationDateToStringAndLastFourDigitsCard,
      pagination,
    }

    const response = await request(serverStub)
      .get('/cards')
      .set('Authorization', 'Bearer token')
      .query(pagination)

    expect(response.body).toEqual(listCardsPaginationDisplay)
    expect(response.statusCode).toBe(HttpStatusCode.Ok)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')
    expect(cardsRepositoryFindByUserIdSpy).toHaveBeenCalledWith(
      userId,
      (pagination.currentPage - 1) * pagination.itemsPerPage,
      pagination.itemsPerPage,
    )

    cardsRepositoryFindByUserIdSpy.mockRestore()
  })

  it('should call next with error and return 500 on failure', async () => {
    const listOfCardsUseCaseSpy = jest
      .spyOn(ListOfCardsUseCase.prototype, 'execute')
      .mockRejectedValue(new InternalServerError('error'))

    const response = await request(serverStub)
      .get('/cards')
      .set('Authorization', 'Bearer token')

    expect(response.statusCode).toBe(HttpStatusCode.InternalServerError)
    expect(response.body).toEqual({ message: 'error' })
    expect(listOfCardsUseCaseSpy).toHaveBeenCalled()

    listOfCardsUseCaseSpy.mockRestore()
  })
})
