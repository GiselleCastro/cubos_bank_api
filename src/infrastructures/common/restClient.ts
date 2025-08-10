import type { AxiosInstance } from 'axios'

export class RestClient {
  constructor(protected readonly instance: AxiosInstance) {}

  protected async post<T>(url: string, body?: T, headers = {}) {
    return this.instance.post(url, body, {
      headers,
    })
  }

  protected async get(url: string, params = {}, headers = {}) {
    return this.instance.get(url, {
      params: { ...params },
      headers,
    })
  }

  protected async put<T>(url: string, body?: T, headers = {}) {
    return this.instance.put(url, body, {
      headers,
    })
  }
}
