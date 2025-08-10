import type { Express } from 'express'
import { buildServer } from '../../src/app'
import { faker } from '@faker-js/faker'
import request from 'supertest'
import { HttpStatusCode } from 'axios'
import { CreateAccountUseCase } from '../../src/use-cases/createAccount'
import { BadRequestError } from '../../src/err/appError'

const userId = faker.string.uuid()

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((_, __) => {
    return { id: userId }
  }),
}))

jest.mock('../../src/use-cases/createAccount')

describe('POST /accounts', () => {
  let serverStub: Express

  beforeAll(async () => {
    serverStub = await buildServer()
  })

  afterAll(async () => {})

  it('should return status 201 and the created account', async () => {
    const createAccountInput = {
      branch: faker.string.numeric({ length: 3 }),
      account: `${faker.string.numeric({ length: 7 })}-${faker.string.numeric({ length: 1 })}`,
    }

    const createdAccountMock = {
      id: faker.string.uuid(),
      branch: createAccountInput.branch,
      account: createAccountInput.account,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const createAccountUseCaseSpy = jest
      .spyOn(CreateAccountUseCase.prototype, 'execute')
      .mockResolvedValue(createdAccountMock)

    const response = await request(serverStub)
      .post('/accounts')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer token')
      .send(createAccountInput)

    expect(response.statusCode).toBe(HttpStatusCode.Created)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')

    const createdAccountMockDateToString = {
      ...createdAccountMock,
      createdAt: createdAccountMock.createdAt.toISOString(),
      updatedAt: createdAccountMock.updatedAt.toISOString(),
    }
    expect(response.body).toEqual(createdAccountMockDateToString)
    expect(createAccountUseCaseSpy).toHaveBeenCalledWith(createAccountInput, userId)

    createAccountUseCaseSpy.mockRestore()
  })

  it('should return status 400 and the error message on failure', async () => {
    const createAccountInput = {
      branch: faker.string.numeric({ length: 3 }),
      account: `${faker.string.numeric({ length: 7 })}-${faker.string.numeric({ length: 1 })}`,
    }

    const createAccountUseCaseSpy = jest
      .spyOn(CreateAccountUseCase.prototype, 'execute')
      .mockRejectedValue(new BadRequestError('Invalid account data'))

    const response = await request(serverStub)
      .post('/accounts')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer token')
      .send(createAccountInput)

    expect(response.statusCode).toBe(HttpStatusCode.BadRequest)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')
    expect(response.body).toEqual({
      message: 'Invalid account data',
    })
    expect(createAccountUseCaseSpy).toHaveBeenCalledWith(createAccountInput, userId)

    createAccountUseCaseSpy.mockRestore()
  })
})
