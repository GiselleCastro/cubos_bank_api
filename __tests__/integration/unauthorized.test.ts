import type { Express } from 'express'
import { buildServer } from '../../src/app'
import request from 'supertest'
import { HttpStatusCode } from 'axios'
import { ListOfCardsUseCase } from '../../src/use-cases/listOfCards'

jest.mock('../../src/use-cases/listOfCards')

describe('GET /cards', () => {
  let serverStub: Express

  beforeAll(async () => {
    serverStub = await buildServer()
  })

  afterAll(async () => {})

  it('should return 401 and the route cannot be accessed because there is no token', async () => {
    const listOfCardsUseCaseSpy = jest
      .spyOn(ListOfCardsUseCase.prototype, 'execute')
      .mockImplementation(jest.fn())

    const response = await request(serverStub).get('/cards')

    expect(response.statusCode).toBe(HttpStatusCode.Unauthorized)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')
    expect(response.body).toEqual({
      message: 'No token.',
    })
    expect(listOfCardsUseCaseSpy).not.toHaveBeenCalled()

    listOfCardsUseCaseSpy.mockRestore()
  })

  it('should return 401 and it will not be possible to access the route due to an invalid token', async () => {
    const listOfCardsUseCaseSpy = jest
      .spyOn(ListOfCardsUseCase.prototype, 'execute')
      .mockImplementation(jest.fn())

    const response = await request(serverStub)
      .get('/cards')
      .set('Authorization', 'Bearer token')

    expect(response.statusCode).toBe(HttpStatusCode.Unauthorized)
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8')
    expect(response.body).toEqual({
      message: 'Token invalid.',
    })
    expect(listOfCardsUseCaseSpy).not.toHaveBeenCalled()

    listOfCardsUseCaseSpy.mockRestore()
  })
})
