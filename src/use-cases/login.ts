import type { UsersRepository } from '../repositories/users'
import type { LoginDataLoginData, Token } from '../types/users'
import { compare } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { AppError, BadRequestError, InternalServerError } from '../err/appError'

export class LoginUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(data: LoginDataLoginData): Promise<Token | null> {
    data.document = data.document.replace(/\D/g, '')

    try {
      const userFound = await this.usersRepository.findByDocument(data.document)

      if (!userFound) {
        throw new BadRequestError('Non existent people.')
      }

      const checkPassword = await compare(data.password, userFound.passwordHash)

      if (!checkPassword) {
        throw new BadRequestError('Password does not match.')
      }

      const token = this.generateToken(userFound.id)

      const tokenBearer = {
        token,
      }

      return tokenBearer
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new InternalServerError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message || 'Error in the process of login.',
      )
    }
  }

  private generateToken(userId: string) {
    const payload = {
      id: userId,
    }

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_SECRET_EXPIRES_IN_SECONDS,
    })
    return token
  }
}
