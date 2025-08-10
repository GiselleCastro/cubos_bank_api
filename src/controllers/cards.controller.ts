import type { NextFunction, Request, Response } from 'express'
import type { ListOfCardsUseCase } from '../use-cases/listOfCards'
import { HttpStatusCode } from 'axios'

export class CardsController {
  constructor(private readonly listOfCardsUseCase: ListOfCardsUseCase) {}

  listOfCards() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.headers.authorization as string
        const itemsPerPage = req.query?.itemsPerPage
        const currentPage = req.query?.currentPage
        const args = {
          userId,
          ...(itemsPerPage && { itemsPerPage: +itemsPerPage }),
          ...(currentPage && { currentPage: +currentPage }),
        }
        const result = await this.listOfCardsUseCase.execute(args)
        return res.status(HttpStatusCode.Ok).json(result)
      } catch (error) {
        next(error)
      }
    }
  }
}
