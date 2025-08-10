import { HttpStatusCode } from 'axios'

export abstract class AppError extends Error {
  public readonly statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, HttpStatusCode.InternalServerError)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, HttpStatusCode.BadRequest)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatusCode.Unauthorized)
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable Entity') {
    super(message, HttpStatusCode.UnprocessableEntity)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, HttpStatusCode.Conflict)
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'PaymentRequired') {
    super(message, HttpStatusCode.PaymentRequired)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HttpStatusCode.Forbidden)
  }
}

export class RequestTimeoutError extends AppError {
  constructor(message = 'RequestTimeout') {
    super(message, HttpStatusCode.RequestTimeout)
  }
}
