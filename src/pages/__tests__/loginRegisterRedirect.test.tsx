import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '@/stores/authStore'

const mockUseAuthStore = vi.mocked(useAuthStore)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginPage auth redirect', () => {
  it('redirects to /app/notebooks when authenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { status: string }) => unknown) =>
      selector({ status: 'authenticated' })
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

  it('renders normally when unauthenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { status: string }) => unknown) =>
      selector({ status: 'unauthenticated' })
    )
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})

describe('RegisterPage auth redirect', () => {
  it('redirects to /app/notebooks when authenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { status: string }) => unknown) =>
      selector({ status: 'authenticated' })
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
})
