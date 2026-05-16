import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProactiveRefresh } from '../hooks/useProactiveRefresh'

vi.mock('@/api/rawClient', () => ({
  rawClient: {
    post: vi.fn(),
  },
}))

vi.mock('@/stores/authStore', () => {
  const mockSetAuth = vi.fn()
  const mockClearAuth = vi.fn()
  const store = {
    accessToken: null as string | null,
    setAuth: mockSetAuth,
    clearAuth: mockClearAuth,
  }
  return {
    useAuthStore: Object.assign(
      vi.fn((selector: (s: typeof store) => unknown) => selector(store)),
      { getState: () => store }
    ),
    __store: store,
    __mockSetAuth: mockSetAuth,
    __mockClearAuth: mockClearAuth,
  }
})

import { rawClient } from '@/api/rawClient'
import { useAuthStore, __store, __mockSetAuth, __mockClearAuth } from '@/stores/authStore'

const mockRawClientPost = vi.mocked(rawClient.post)

function makeFakeToken(expOffsetMs: number): string {
  const exp = Math.floor((Date.now() + expOffsetMs) / 1000)
  const payload = btoa(JSON.stringify({ sub: 'user-1', exp }))
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.fake-sig`
}

describe('useProactiveRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    __store.accessToken = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does nothing when accessToken is null', () => {
    __store.accessToken = null
    renderHook(() => useProactiveRefresh())
    vi.runAllTimers()
    expect(mockRawClientPost).not.toHaveBeenCalled()
  })

  it('schedules a refresh 60 seconds before JWT expiry', async () => {
    const fiveMinutesMs = 5 * 60 * 1000
    __store.accessToken = makeFakeToken(fiveMinutesMs)

    const newToken = 'new-access-token'
    const newUser = { id: 'u1', email: 'a@b.com', displayName: 'Test' }
    mockRawClientPost.mockResolvedValue({ data: { accessToken: newToken, user: newUser } })

    renderHook(() => useProactiveRefresh())

    act(() => vi.advanceTimersByTime(3 * 60 * 1000))
    expect(mockRawClientPost).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(61 * 1000)
      await vi.runAllTimersAsync()
    })

    expect(mockRawClientPost).toHaveBeenCalledWith('/auth/refresh')
    expect(__mockSetAuth).toHaveBeenCalledWith(newUser, newToken)
  })

  it('calls clearAuth when the refresh request fails', async () => {
    const fiveMinutesMs = 5 * 60 * 1000
    __store.accessToken = makeFakeToken(fiveMinutesMs)
    mockRawClientPost.mockRejectedValue(new Error('network error'))

    renderHook(() => useProactiveRefresh())

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000)
      await vi.runAllTimersAsync()
    })

    expect(__mockClearAuth).toHaveBeenCalled()
    expect(__mockSetAuth).not.toHaveBeenCalled()
  })

  it('cancels the scheduled refresh when the component unmounts', () => {
    const fiveMinutesMs = 5 * 60 * 1000
    __store.accessToken = makeFakeToken(fiveMinutesMs)
    mockRawClientPost.mockResolvedValue({ data: { accessToken: 'tok', user: {} } })

    const { unmount } = renderHook(() => useProactiveRefresh())

    unmount()

    vi.runAllTimers()
    expect(mockRawClientPost).not.toHaveBeenCalled()
  })

  it('ignores a malformed access token without throwing', () => {
    __store.accessToken = 'not.a.valid.jwt'
    expect(() => renderHook(() => useProactiveRefresh())).not.toThrow()
    vi.runAllTimers()
    expect(mockRawClientPost).not.toHaveBeenCalled()
  })
})
