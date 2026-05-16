import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing client
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}))

vi.mock('i18next', () => ({
  default: { language: 'en' },
}))

vi.mock('@/env', () => ({
  env: { VITE_API_BASE_URL: 'http://localhost:5000', VITE_GOOGLE_CLIENT_ID: 'test' },
}))

vi.mock('@/api/rawClient', () => ({
  rawClient: { post: vi.fn() },
}))

import { useAuthStore } from '@/stores/authStore'
import { client } from '@/api/client'

const mockGetState = vi.mocked(useAuthStore.getState)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Axios client interceptors', () => {
  it('attaches Authorization header when token is present', async () => {
    mockGetState.mockReturnValue({
      status: 'authenticated',
      accessToken: 'test-token',
      user: null,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
      setLoading: vi.fn(),
    })

    // Intercept the outgoing request to inspect headers
    let capturedHeaders: Record<string, string> = {}
    const mockAdapter = vi.fn().mockImplementation((config: { headers: Record<string, string> }) => {
      capturedHeaders = { ...config.headers }
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config })
    })

    await client.get('/test', { adapter: mockAdapter })
    expect(capturedHeaders['Authorization']).toBe('Bearer test-token')
  })

  it('does not attach Authorization header when token is null', async () => {
    mockGetState.mockReturnValue({
      status: 'unauthenticated',
      accessToken: null,
      user: null,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
      setLoading: vi.fn(),
    })

    let capturedHeaders: Record<string, string> = {}
    const mockAdapter = vi.fn().mockImplementation((config: { headers: Record<string, string> }) => {
      capturedHeaders = { ...config.headers }
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config })
    })

    await client.get('/test', { adapter: mockAdapter })
    expect(capturedHeaders['Authorization']).toBeUndefined()
  })
})
