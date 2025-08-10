import type { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { env } from '../config/env'
import type { TokenDecode } from '../types/users'
import { UnauthorizedError } from '../err/appError'
interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload
}

export class AuthMiddleware {
  static handle() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token.')
      }

      const token = authHeader.split(' ')[1]

      if (!token) {
        throw new UnauthorizedError('No token.')
      }

      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as TokenDecode
        req.headers.authorization = decoded.id
        next()
      } catch {
        throw new UnauthorizedError('Token invalid.')
      }
    }
  }
}
