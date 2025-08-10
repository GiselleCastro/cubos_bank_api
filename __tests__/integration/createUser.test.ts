import type { Express } from 'express'
import { buildServer } from '../../src/app'
import { faker } from '@faker-js/faker'
import request from 'supertest'
import { HttpStatusCode } from 'axios'
import { CreateUserUseCase } from '../../src/use-cases/createUser'
import { BadRequestError } from '../../src/err/appError'
import fakerBr from 'faker-br'

jest.mock('../../src/use-cases/createUser')

describe('POST /people', () => {
  let serverStub: Express

  beforeAll(async () => {
    serverStub = await buildServer()
  })

  afterAll(async () => {})

  it('should return status 201 and create user', async () => {
    const createInput = {
      name: faker.person.firstName(),
      document: fakerBr.br.cpf(),
      password: faker.internet.password(),
    }

    const newUser = {
      ...createInput,
      id: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const createUserUseCaseSpy = jest
      .spyOn(CreateUserUseCase.prototype, 'execute')
      .mockResolvedValue(newUser)

    const response = await request(serverStub)
      .post('/people')
      .set('Content-Type', 'application/json')
      .send(createInput)

    expect(response.statusCode).toBe(HttpStatusCode.Created)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')

    const newUserDateToString = {
      ...newUser,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    }

    expect(response.body).toEqual(newUserDateToString)
    expect(createUserUseCaseSpy).toHaveBeenCalledWith(createInput)

    createUserUseCaseSpy.mockRestore()
  })

  it('should return status 400 if there is an error creating the usern', async () => {
    const createInput = {
      name: faker.person.firstName(),
      document: fakerBr.br.cpf(),
      password: faker.internet.password(),
    }

    const createUserUseCaseSpy = jest
      .spyOn(CreateUserUseCase.prototype, 'execute')
      .mockRejectedValue(new BadRequestError('error'))

    const response = await request(serverStub)
      .post('/people')
      .set('Content-Type', 'application/json')
      .send(createInput)

    expect(response.statusCode).toBe(HttpStatusCode.BadRequest)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')
    expect(response.body).toEqual({
      message: 'error',
    })
    expect(createUserUseCaseSpy).toHaveBeenCalledWith(createInput)

    createUserUseCaseSpy.mockRestore()
  })
})
