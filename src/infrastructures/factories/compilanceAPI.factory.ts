import { CompilanceAPI } from '../compilanceAPI'
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { env } from '../../config/env'

export class CompilanceAPIFactory {
  static make(): CompilanceAPI {
    const instance: AxiosInstance = axios.create({
      baseURL: `${env.API_COMPILANCE_CUBOS_BASE_URL}`,
      timeout: Number(`${env.API_COMPILANCE_CUBOS_TIMEOUT}`),
    })

    return new CompilanceAPI(instance)
  }
}
