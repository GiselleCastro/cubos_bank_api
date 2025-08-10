import { RestClient } from './common/restClient'
import type { AxiosInstance } from 'axios'
import { HttpStatusCode, AxiosError } from 'axios'
import { AppError, InternalServerError, UnauthorizedError } from '../err/appError'
import type { ValidationDocumentType } from '../types/users'
import type {
  CreateTransactionCompilanceAPI,
  ListTransactionCompilanceAPIResponse,
  TransactionCompilanceAPIResponse,
} from '../types/transactions'
import { logger } from '../config/logger'

export class CompilanceAPI extends RestClient {
  private authCode: string | null = null
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private isRefreshing = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private failedQueue: any[] = []

  constructor(instance: AxiosInstance) {
    super(instance)
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (!originalRequest) {
          return Promise.reject(error)
        }

        if (
          error.response?.status === HttpStatusCode.Unauthorized &&
          !originalRequest._retry
        ) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            })
              .then((token) => {
                originalRequest.headers['Authorization'] = `Bearer ${token}`
                return this.instance(originalRequest)
              })
              .catch((error) => Promise.reject(error))
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            await this.refreshAccessToken()
            originalRequest.headers['Authorization'] = `Bearer ${this.accessToken}`
            this.processQueue(null, this.accessToken)
            return this.instance(originalRequest)
          } catch {
            try {
              await this.createAccessToken()
              originalRequest.headers['Authorization'] = `Bearer ${this.accessToken}`
              this.processQueue(null, this.accessToken)
              return this.instance(originalRequest)
            } catch (error) {
              this.processQueue(error, null)
              return Promise.reject(error)
            }
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(error)
      },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error)
      else resolve(token)
    })
    this.failedQueue = []
  }

  private async obtainAuthCode() {
    try {
      const response = await this.post(`/auth/code`, {
        email: process.env.API_COMPILANCE_CUBOS_CLIENT,
        password: process.env.API_COMPILANCE_CUBOS_SECRET,
      })
      logger.info(response.data)
      this.authCode = response.data.data.authCode
    } catch {
      logger.error('obtainAuthCode')
      throw new InternalServerError(`Unable to obtain auth code.`)
    }
  }

  private async createAccessToken() {
    try {
      const response = await this.post(`/auth/token`, {
        authCode: this.authCode,
      })
      logger.info(response.data)
      this.accessToken = response.data.data.accessToken
      this.refreshToken = response.data.data.refreshToken
    } catch (error) {
      if (
        error instanceof AxiosError &&
        error.response?.status === HttpStatusCode.Unauthorized
      ) {
        this.refreshToken = null
        this.accessToken = null
        this.authCode = null
        logger.error('Invalid auth code.')
        throw new UnauthorizedError('Invalid auth code.')
      }
      logger.error('Unable to obtain access token.')
      throw new InternalServerError('Unable to obtain access token.')
    }
  }

  private async refreshAccessToken() {
    try {
      const response = await this.instance.post('/auth/refresh', {
        refreshToken: this.refreshToken,
      })
      logger.info(response.data)
      this.accessToken = response.data.data.accessToken
    } catch (error) {
      if (
        error instanceof AxiosError &&
        error.response?.status === HttpStatusCode.Unauthorized
      ) {
        this.refreshToken = null
        this.accessToken = null
        this.authCode = null
        logger.error('Refresh token expired.')
        throw new InternalServerError('Interna lServer Error')
      }
      logger.error('Unable to obtain refresh access token.')
      throw new InternalServerError('Internal Server Error.')
    }
  }

  protected async getHeaders() {
    const config = {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: '',
      },
    }

    if (!this.accessToken) {
      await this.obtainAuthCode()
      await this.createAccessToken()
    }

    if (this.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${this.accessToken}`
    }

    return config.headers
  }

  async validateCPF(data: { document: string }): Promise<ValidationDocumentType> {
    const headers = await this.getHeaders()
    try {
      const response = await this.post(`/cpf/validate`, data, headers)
      logger.info(response.data)
      return response.data
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Unable to validate CPF.')
      throw new InternalServerError('Unable to validate document.')
    }
  }

  async validateCNPJ(data: { document: string }): Promise<ValidationDocumentType> {
    const headers = await this.getHeaders()

    try {
      const response = await this.post(`/cnpj/validate`, data, headers)
      logger.info(response.data)
      return response.data
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Unable to validate CNPJ.')
      throw new InternalServerError('Unable to validate document.')
    }
  }

  async createTransaction(
    id: string,
    data: CreateTransactionCompilanceAPI,
  ): Promise<TransactionCompilanceAPIResponse> {
    const headers = await this.getHeaders()
    try {
      const response = await this.put(`/transaction/${id}`, data, headers)
      logger.info(response.data)
      return response.data
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Unable to create transaction.')
      throw new InternalServerError('Unable to create transaction.')
    }
  }

  async getTransactionById(id: string): Promise<TransactionCompilanceAPIResponse> {
    const headers = await this.getHeaders()

    try {
      const response = await this.get(`/transaction/${id}`, {}, headers)
      logger.info(response.data)
      return response.data
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Unable to get transaction by id.')
      throw new InternalServerError('Unable to get transaction by id.')
    }
  }

  async getAllTransaction(): Promise<ListTransactionCompilanceAPIResponse> {
    const headers = await this.getHeaders()
    try {
      const response = await this.get(`/transaction`, {}, headers)
      logger.info(response.data)
      return response.data
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Unable to get transaction list.')
      throw new InternalServerError('Unable to get transaction list.')
    }
  }
}
