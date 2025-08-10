import type { Express } from 'express'
import { buildServer } from '../../src/app'
import request from 'supertest'
import { faker } from '@faker-js/faker'
import { HttpStatusCode } from 'axios'
import { CreateCardUseCase } from '../../src/use-cases/createCard'
import { CardType } from '@prisma/client'
import { AccountsRepository } from '../../src/repositories/accounts'
import { CardsRepository } from '../../src/repositories/cards'
import { InternalServerError } from '../../src/err/appError'

const userId = faker.string.uuid()
const accountId = faker.string.uuid()

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((_, __) => {
    return { id: userId }
  }),
}))

jest.mock('../../src/repositories/accounts')
jest.mock('../../src/repositories/cards')

describe('POST /accounts/:accountId/cards', () => {
  let serverStub: Express

  beforeAll(async () => {
    serverStub = await buildServer()
  })

  afterAll(async () => {})

  it('should create a card and return 201 with card data virtual', async () => {
    const cardPayload = {
      type: CardType.virtual,
      number: faker.finance.creditCardNumber('mastercard').replace(/\D/g, ''),
      cvv: faker.finance.creditCardCVV(),
    }

    const createdCard = {
      id: faker.string.uuid(),
      type: cardPayload.type,
      number: cardPayload.number.slice(-4),
      cvv: cardPayload.cvv,
      createdAt: faker.date.anytime(),
      updatedAt: faker.date.anytime(),
    }

    const accountsRepositoryFindByAccountIdSpy = jest
      .spyOn(AccountsRepository.prototype, 'findByAccountId')
      .mockResolvedValue({
        id: accountId,
        branch: faker.string.numeric({ length: 3 }),
        account: `${faker.string.numeric({ length: 7 })}-${faker.string.numeric({ length: 1 })}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        balance: 10,
        userId: userId,
      })

    const cardsRepositoryFindByAccountIdAndTypeSpy = jest
      .spyOn(CardsRepository.prototype, 'findByAccountIdAndType')
      .mockResolvedValue(null)

    const cardsRepositoryFindByTokenSpy = jest
      .spyOn(CardsRepository.prototype, 'findByToken')
      .mockResolvedValue(null)

    const cardsRepositoryCreateSpy = jest
      .spyOn(CardsRepository.prototype, 'create')
      .mockResolvedValue({
        id: createdCard.id,
        type: createdCard.type,
        createdAt: createdCard.createdAt,
        updatedAt: createdCard.updatedAt,
        accountId,
        last4: createdCard.number,
        token: faker.string.alphanumeric(),
        blob: new Uint8Array([1, 2, 3, 4]),
      })

    const expectedResponse = {
      ...createdCard,
      createdAt: createdCard.createdAt.toISOString(),
      updatedAt: createdCard.updatedAt.toISOString(),
    }

    const response = await request(serverStub)
      .post(`/accounts/${accountId}/cards`)
      .set('Authorization', 'Bearer token')
      .send(cardPayload)

    expect(response.body).toEqual(expectedResponse)
    expect(response.statusCode).toBe(HttpStatusCode.Created)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')

    expect(accountsRepositoryFindByAccountIdSpy).toHaveBeenCalledTimes(1)
    expect(cardsRepositoryFindByAccountIdAndTypeSpy).toHaveBeenCalledTimes(0)
    expect(cardsRepositoryFindByTokenSpy).toHaveBeenCalledTimes(1)
    expect(cardsRepositoryCreateSpy).toHaveBeenCalledTimes(1)

    accountsRepositoryFindByAccountIdSpy.mockRestore()
    cardsRepositoryFindByAccountIdAndTypeSpy.mockRestore()
    cardsRepositoryFindByTokenSpy.mockRestore()
    cardsRepositoryCreateSpy.mockRestore()
  })

  it('should return an error with status 409 if you try to create a physical card and a physical card already exists for the account', async () => {
    const cardPayload = {
      type: CardType.physical,
      number: faker.finance.creditCardNumber('mastercard').replace(/\D/g, ''),
      cvv: faker.finance.creditCardCVV(),
    }

    const createdCard = {
      id: faker.string.uuid(),
      type: cardPayload.type,
      number: cardPayload.number.slice(-4),
      cvv: cardPayload.cvv,
      createdAt: faker.date.anytime(),
      updatedAt: faker.date.anytime(),
    }

    const accountsRepositoryFindByAccountIdSpy = jest
      .spyOn(AccountsRepository.prototype, 'findByAccountId')
      .mockResolvedValue({
        id: accountId,
        branch: faker.string.numeric({ length: 3 }),
        account: `${faker.string.numeric({ length: 7 })}-${faker.string.numeric({ length: 1 })}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        balance: 10,
        userId: userId,
      })

    const cardsRepositoryFindByAccountIdAndTypeSpy = jest
      .spyOn(CardsRepository.prototype, 'findByAccountIdAndType')
      .mockResolvedValue({
        id: createdCard.id,
        type: createdCard.type,
        createdAt: createdCard.createdAt,
        updatedAt: createdCard.updatedAt,
        accountId,
        last4: createdCard.number,
        token: faker.string.alphanumeric(),
        blob: new Uint8Array([1, 2, 3, 4]),
      })

    const cardsRepositoryFindByTokenSpy = jest
      .spyOn(CardsRepository.prototype, 'findByToken')
      .mockImplementation(jest.fn())

    const cardsRepositoryCreateSpy = jest
      .spyOn(CardsRepository.prototype, 'create')
      .mockImplementation(jest.fn())

    const response = await request(serverStub)
      .post(`/accounts/${accountId}/cards`)
      .set('Authorization', 'Bearer token')
      .send(cardPayload)

    expect(response.body).toEqual({
      message: 'There is already a physical card for this account',
    })
    expect(response.statusCode).toBe(HttpStatusCode.Conflict)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')

    expect(accountsRepositoryFindByAccountIdSpy).toHaveBeenCalledTimes(1)
    expect(cardsRepositoryFindByAccountIdAndTypeSpy).toHaveBeenCalledTimes(1)
    expect(cardsRepositoryFindByTokenSpy).toHaveBeenCalledTimes(0)
    expect(cardsRepositoryCreateSpy).toHaveBeenCalledTimes(0)

    accountsRepositoryFindByAccountIdSpy.mockRestore()
    cardsRepositoryFindByAccountIdAndTypeSpy.mockRestore()
    cardsRepositoryFindByTokenSpy.mockRestore()
    cardsRepositoryCreateSpy.mockRestore()
  })

  it('should call next with error and return 500 on failure', async () => {
    const createCardUseCaseSpy = jest
      .spyOn(CreateCardUseCase.prototype, 'execute')
      .mockRejectedValue(new InternalServerError('error'))

    const response = await request(serverStub)
      .post(`/accounts/${accountId}/cards`)
      .set('Authorization', 'Bearer token')
      .send({
        type: CardType.physical,
        number: faker.finance.creditCardNumber('mastercard').replace(/\D/g, ''),
        cvv: faker.finance.creditCardCVV(),
      })

    expect(response.statusCode).toBe(HttpStatusCode.InternalServerError)
    expect(response.body).toEqual({ message: 'error' })
    expect(createCardUseCaseSpy).toHaveBeenCalled()

    createCardUseCaseSpy.mockRestore()
  })
})
