import type { Request, Response, NextFunction } from 'express'
import type { ZodObject } from 'zod'
import { ZodError } from 'zod'
import { UnprocessableEntityError } from '../err/appError'

export enum Params {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params',
}
type ParamType = Params.BODY | Params.QUERY | Params.PARAMS

export class ValidateSchemaMiddleware {
  static handle(schema: ZodObject, param: ParamType = Params.BODY) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        await schema.parseAsync(req[param])
        next()
      } catch (error) {
        if (error instanceof ZodError)
          next(new UnprocessableEntityError(JSON.stringify(error.issues)))
      }
    }
  }
}
