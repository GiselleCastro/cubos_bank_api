import type { Express } from 'express'
import { buildServer } from '../../src/app'
import request from 'supertest'
import { faker } from '@faker-js/faker'
import { HttpStatusCode } from 'axios'
import { ListOfAccountsUseCase } from '../../src/use-cases/listOfAccounts'
import { InternalServerError } from '../../src/err/appError'

const userId = faker.string.uuid()

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((_, __) => {
    return { id: userId }
  }),
}))

jest.mock('../../src/use-cases/listOfAccounts')

describe('GET /accounts', () => {
  let serverStub: Express

  beforeAll(async () => {
    serverStub = await buildServer()
  })

  afterAll(async () => {})

  it('should return 200 and the list of accounts', async () => {
    const mockAccounts = Array.from({
      length: faker.number.int({ min: 1, max: 10 }),
    }).map(() => ({
      id: faker.string.uuid(),
      branch: faker.string.numeric({ length: 3 }),
      account: `${faker.string.numeric({ length: 7 })}-${faker.string.numeric({ length: 1 })}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    const listOfAccountsUseCaseSpy = jest
      .spyOn(ListOfAccountsUseCase.prototype, 'execute')
      .mockResolvedValue(mockAccounts)

    const responseData = mockAccounts.map((acc) => ({
      ...acc,
      createdAt: acc.createdAt.toISOString(),
      updatedAt: acc.updatedAt.toISOString(),
    }))

    const response = await request(serverStub)
      .get('/accounts')
      .set('Authorization', 'Bearer token')

    expect(response.statusCode).toBe(HttpStatusCode.Ok)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')
    expect(response.body).toEqual(responseData)
    expect(listOfAccountsUseCaseSpy).toHaveBeenCalledWith(userId)

    listOfAccountsUseCaseSpy.mockRestore()
  })

  it('should call next with error and return 500 on failure', async () => {
    const listOfAccountsUseCaseSpy = jest
      .spyOn(ListOfAccountsUseCase.prototype, 'execute')
      .mockRejectedValue(new InternalServerError('error'))

    const response = await request(serverStub)
      .get('/accounts')
      .set('Authorization', 'Bearer token')

    expect(response.statusCode).toBe(HttpStatusCode.InternalServerError)
    expect(response.body).toEqual({ message: 'error' })
    expect(listOfAccountsUseCaseSpy).toHaveBeenCalled()

    listOfAccountsUseCaseSpy.mockRestore()
  })
})
