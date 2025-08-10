import { loginBodySchema, createUserBodySchema } from '../schema/users'
import { z } from 'zod'

export type LoginDataLoginData = z.infer<typeof loginBodySchema>

export type CreateUserPayload = z.infer<typeof createUserBodySchema>

export type Token = {
  token: string
}

export type TokenDecode = {
  id: string
}

type DocumentInfo = {
  document: string
  status: number
  reason: string
}

export type ValidationDocumentType = {
  success: boolean
  data: DocumentInfo
}

export type CreateUser = {
  id: string
  name: string
  document: string
  passwordHash: string
}

export type CreateUserReturn = {
  id: string
  name: string
  document: string
  createdAt: Date
  updatedAt: Date
}
