import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <div data-testid="google-login-btn">Google</div>,
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async () => ({ values: {}, errors: {} }),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/features/auth/api/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}))

import { useAuthStore } from '@/stores/authStore'

const mockUseAuthStore = vi.mocked(useAuthStore)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginPage auth redirect', () => {
  it('redirects to /app/notebooks when authenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ status: 'authenticated', setAuth: vi.fn() })
    )
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app/notebooks" element={<div>Notebooks</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(container.textContent).toContain('Notebooks')
  })

  it('renders the email/password form when unauthenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ status: 'unauthenticated', setAuth: vi.fn() })
    )
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
  })
})

describe('RegisterPage auth redirect', () => {
  it('redirects to /app/notebooks when authenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ status: 'authenticated', setAuth: vi.fn() })
    )
    const { container } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/app/notebooks" element={<div>Notebooks</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(container.textContent).toContain('Notebooks')
  })

  it('renders the registration form when unauthenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ status: 'unauthenticated', setAuth: vi.fn() })
    )
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /register\.submitButton/i })).toBeInTheDocument()
  })
})
