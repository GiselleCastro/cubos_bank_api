import type { NextFunction, Request, Response } from 'express'
import type { CreateAccountUseCase } from '../use-cases/createAccount'
import type { ListOfAccountsUseCase } from '../use-cases/listOfAccounts'
import type { CreateCardUseCase } from '../use-cases/createCard'
import type { CheckBalanceUseCase } from '../use-cases/checkBalance'
import type { ListOfCardsByAccountUseCase } from '../use-cases/listOfCardsByAccount'
import { HttpStatusCode } from 'axios'

export class AccountsController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listOfAccountsUseCase: ListOfAccountsUseCase,
    private readonly createCardUseCase: CreateCardUseCase,
    private readonly checkBalanceUseCase: CheckBalanceUseCase,
    private readonly listOfCardsByAccountUseCase: ListOfCardsByAccountUseCase,
  ) {}

  createAccount() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.headers.authorization as string
        const result = await this.createAccountUseCase.execute(req.body, userId)
        return res.status(HttpStatusCode.Created).json(result)
      } catch (error) {
        next(error)
      }
    }
  }

  listOfAccounts() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.headers.authorization as string
        const result = await this.listOfAccountsUseCase.execute(userId)
        return res.status(HttpStatusCode.Ok).json(result)
      } catch (error) {
        next(error)
      }
    }
  }

  createCard() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const accountId = req.params.accountId as string
        const userId = req.headers.authorization as string
        const result = await this.createCardUseCase.execute(req.body, accountId, userId)
        return res.status(HttpStatusCode.Created).json(result)
      } catch (error) {
        next(error)
      }
    }
  }

  listOfCardsByAccount() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const accountId = req.params.accountId as string
        const userId = req.headers.authorization as string
        const result = await this.listOfCardsByAccountUseCase.execute(accountId, userId)
        return res.status(HttpStatusCode.Ok).json(result)
      } catch (error) {
        next(error)
      }
    }
  }

  checkBalance() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const accountId = req.params.accountId as string
        const userId = req.headers.authorization as string
        const result = await this.checkBalanceUseCase.execute(accountId, userId)
        return res.status(HttpStatusCode.Ok).json(result)
      } catch (error) {
        next(error)
      }
    }
  }
}
