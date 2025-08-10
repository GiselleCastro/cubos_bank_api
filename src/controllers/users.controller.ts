import type { NextFunction, Request, Response } from 'express'
import type { CreateUserUseCase } from '../use-cases/createUser'
import type { LoginUseCase } from '../use-cases/login'
import { HttpStatusCode } from 'axios'

export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  registerUser() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await this.createUserUseCase.execute(req.body)
        return res.status(HttpStatusCode.Created).json(result)
      } catch (error) {
        next(error)
      }
    }
  }

  login() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await this.loginUseCase.execute(req.body)
        return res.status(HttpStatusCode.Ok).json(result)
      } catch (error) {
        next(error)
      }
    }
  }
}
