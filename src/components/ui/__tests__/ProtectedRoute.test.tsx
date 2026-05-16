import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'

// Mock the authStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '@/stores/authStore'

const mockUseAuthStore = vi.mocked(useAuthStore)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProtectedRoute', () => {
  it('renders spinner when status is loading', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { status: string }) => unknown) =>
      selector({ status: 'loading' })
    )
    render(
      <MemoryRouter initialEntries={['/app/notebooks']}>
        <Routes>
          <Route path="/app" element={<ProtectedRoute />}>
            <Route path="notebooks" element={<div>Notebooks</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    // Loader2 icon renders as an SVG; check for animate-spin class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('redirects to /login when unauthenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { status: string }) => unknown) =>
      selector({ status: 'unauthenticated' })
    )
    const { container } = render(
      <MemoryRouter initialEntries={['/app/notebooks']}>
        <Routes>
          <Route path="/app" element={<ProtectedRoute />}>
            <Route path="notebooks" element={<div>Notebooks</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(container.textContent).toContain('Login Page')
  })

  it('renders outlet when authenticated', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { status: string }) => unknown) =>
      selector({ status: 'authenticated' })
    )
    render(
      <MemoryRouter initialEntries={['/app/notebooks']}>
        <Routes>
          <Route path="/app" element={<ProtectedRoute />}>
            <Route path="notebooks" element={<div>Notebooks Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Notebooks Content')).toBeInTheDocument()
  })
})
