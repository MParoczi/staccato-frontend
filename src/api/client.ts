import axios from 'axios'
import i18next from 'i18next'
import { env } from '@/env'
import { useAuthStore } from '@/stores/authStore'
import { rawClient } from './rawClient'
import type { UserProfile } from '@/types'

const client = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = i18next.language ?? 'en'
  return config
})

let refreshPromise: Promise<string> | null = null

client.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as {
      response?: { status?: number }
      config?: { _retried?: boolean; headers?: Record<string, string> } & Record<string, unknown>
    }
    const originalRequest = axiosError.config

    if (axiosError.response?.status !== 401 || originalRequest?._retried) {
      return Promise.reject(error)
    }

    if (originalRequest) {
      originalRequest._retried = true
    }

    if (!refreshPromise) {
      refreshPromise = rawClient
        .post<{ accessToken: string; user: UserProfile }>('/auth/refresh')
        .then((res) => {
          const token = res.data.accessToken
          useAuthStore.getState().setAuth(useAuthStore.getState().user!, token)
          return token
        })
        .catch((refreshError: unknown) => {
          useAuthStore.getState().clearAuth()
          throw refreshError
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const newToken = await refreshPromise
    if (originalRequest?.headers) {
      originalRequest.headers.Authorization = `Bearer ${newToken}`
    }
    return client(originalRequest!)
  },
)

export { client }
