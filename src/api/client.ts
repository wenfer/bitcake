import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { RpcRequest, RpcResponse } from '@/types/transmission'
import { apiRequestTimeoutMs, torrentApiBase } from '@/config/torrentClient'

const SESSION_STORAGE_KEY = 'transmission-session-id'
interface RetryableRequestConfig extends AxiosRequestConfig {
  transmission409Retried?: boolean
}

class TransmissionClient {
  private client: AxiosInstance
  private sessionId: string = ''

  constructor(baseURL: string = torrentApiBase) {
    this.sessionId = this.loadStoredSessionId()
    this.client = axios.create({
      baseURL,
      timeout: apiRequestTimeoutMs,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器：添加 X-Transmission-Session-Id
    this.client.interceptors.request.use((config) => {
      if (this.sessionId) {
        config.headers = config.headers || {}
        config.headers['X-Transmission-Session-Id'] = this.sessionId
      }
      return config
    })

    // 响应拦截器：保存最新 session id，并处理 409 错误重试
    this.client.interceptors.response.use(
      (response) => {
        this.updateSessionId(response)
        return response
      },
      async (error) => {
        if (error.response?.status === 409) {
          const originalRequest = error.config as RetryableRequestConfig | undefined
          const newSessionId = error.response.headers?.['x-transmission-session-id']
          if (!originalRequest || originalRequest.transmission409Retried || !newSessionId) {
            return Promise.reject(error)
          }

          originalRequest.transmission409Retried = true
          this.sessionId = newSessionId
          this.persistSessionId()
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers['X-Transmission-Session-Id'] = this.sessionId
          return this.client(originalRequest)
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * 设置认证信息
   */
  setAuth(username: string, password: string) {
    this.client.defaults.auth = { username, password }
  }


  clearAuth() {
    this.client.defaults.auth = undefined
    this.clearSession()
  }

  /**
   * 发送 RPC 请求
   */
  async request<T = unknown>(method: string, args?: Record<string, unknown>): Promise<T> {
    const request: RpcRequest = {
      method,
      arguments: args,
    }

    const { data } = await this.client.post<RpcResponse<T>>('', request)

    if (data.result !== 'success') {
      throw new Error(`RPC request failed: ${data.result}`)
    }

    return data.arguments as T
  }

  private loadStoredSessionId(): string {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(SESSION_STORAGE_KEY) || ''
  }

  private persistSessionId() {
    if (typeof window === 'undefined') return
    if (this.sessionId) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, this.sessionId)
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  private clearSession() {
    this.sessionId = ''
    this.persistSessionId()
  }

  private updateSessionId(response: AxiosResponse<unknown>) {
    const newId = response.headers?.['x-transmission-session-id']
    if (newId && newId !== this.sessionId) {
      this.sessionId = newId
      this.persistSessionId()
    }
  }
}

export const transmissionClient = new TransmissionClient()
