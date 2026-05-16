import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import type { UserProfile } from '@/types/index'

const mockUser: UserProfile = {
  id: '1',
  email: 'test@example.com',
  displayName: 'Test User',
  firstName: null,
  lastName: null,
  language: 'en',
  defaultPageSize: null,
  defaultInstrumentId: null,
  avatarUrl: null,
  scheduledDeletionAt: null,
}

beforeEach(() => {
  useAuthStore.setState({ status: 'loading', user: null, accessToken: null })
})

describe('authStore', () => {
  it('starts with status loading', () => {
    expect(useAuthStore.getState().status).toBe('loading')
  })

  it('starts with null user and accessToken', () => {
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('setAuth transitions to authenticated', () => {
    useAuthStore.getState().setAuth(mockUser, 'token123')
    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(useAuthStore.getState().accessToken).toBe('token123')
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('clearAuth transitions to unauthenticated', () => {
    useAuthStore.getState().setAuth(mockUser, 'token123')
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().status).toBe('unauthenticated')
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('has no persist middleware', () => {
    // Zustand stores with persist middleware expose a .persist property
    expect((useAuthStore as unknown as Record<string, unknown>).persist).toBeUndefined()
  })

  it('updateUser updates user without changing accessToken', () => {
    useAuthStore.getState().setAuth(mockUser, 'token123')
    const updatedUser: UserProfile = { ...mockUser, firstName: 'Jane' }
    useAuthStore.getState().updateUser(updatedUser)
    expect(useAuthStore.getState().user).toEqual(updatedUser)
    expect(useAuthStore.getState().accessToken).toBe('token123')
    expect(useAuthStore.getState().status).toBe('authenticated')
  })
})
