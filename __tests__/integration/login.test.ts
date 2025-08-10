import type { Express } from 'express'
import { buildServer } from '../../src/app'
import { faker } from '@faker-js/faker'
import request from 'supertest'
import { HttpStatusCode } from 'axios'
import { LoginUseCase } from '../../src/use-cases/login'
import { BadRequestError } from '../../src/err/appError'
import fakerBr from 'faker-br'

jest.mock('../../src/use-cases/login')

describe('POST /login', () => {
  let serverStub: Express

  beforeAll(async () => {
    serverStub = await buildServer()
  })

  afterAll(async () => {})

  it('should return status 200 and the token', async () => {
    const loginInput = {
      document: fakerBr.br.cpf(),
      password: faker.internet.password(),
    }

    const tokenMock = faker.internet.jwt()

    const loginUseCaseSpy = jest
      .spyOn(LoginUseCase.prototype, 'execute')
      .mockResolvedValue({
        token: tokenMock,
      })

    const response = await request(serverStub)
      .post('/login')
      .set('Content-Type', 'application/json')
      .send(loginInput)

    expect(response.statusCode).toBe(HttpStatusCode.Ok)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')
    expect(response.body).toEqual({
      token: tokenMock,
    })
    expect(loginUseCaseSpy).toHaveBeenCalledWith(loginInput)

    loginUseCaseSpy.mockRestore()
  })

  it('should return status 400 and the error when generating the token', async () => {
    const loginInput = {
      document: fakerBr.br.cpf(),
      password: faker.internet.password(),
    }

    const loginUseCaseSpy = jest
      .spyOn(LoginUseCase.prototype, 'execute')
      .mockRejectedValue(new BadRequestError('error'))

    const response = await request(serverStub)
      .post('/login')
      .set('Content-Type', 'application/json')
      .send(loginInput)

    expect(response.statusCode).toBe(HttpStatusCode.BadRequest)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')
    expect(response.body).toEqual({
      message: 'error',
    })
    expect(loginUseCaseSpy).toHaveBeenCalledWith(loginInput)

    loginUseCaseSpy.mockRestore()
  })

  it('should return status 422 if the document is invalid', async () => {
    const loginInput = {
      document: faker.string.numeric(4),
      password: faker.internet.password(),
    }

    const loginUseCaseSpy = jest
      .spyOn(LoginUseCase.prototype, 'execute')
      .mockImplementation(async () => null)

    const response = await request(serverStub)
      .post('/login')
      .set('Content-Type', 'application/json')
      .send(loginInput)

    expect(response.statusCode).toBe(HttpStatusCode.UnprocessableEntity)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')
    expect(loginUseCaseSpy).not.toHaveBeenCalled()

    loginUseCaseSpy.mockRestore()
  })
})
