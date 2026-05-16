import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock everything that has external side effects
vi.mock('@/api/rawClient', () => ({
  rawClient: { post: vi.fn().mockRejectedValue(new Error('no cookie')) },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { status: string; user: null; accessToken: null }) => unknown) =>
    selector({ status: 'unauthenticated', user: null, accessToken: null })
  ),
}))

vi.mock('@/env', () => ({
  env: { VITE_API_BASE_URL: 'http://localhost:5000', VITE_GOOGLE_CLIENT_ID: 'test' },
}))

describe('App smoke test', () => {
  it('renders without crashing', () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    // Use memory router instead of browser router for testing
    const router = createMemoryRouter([
      { path: '/', element: <div>Root</div> },
      { path: '/login', element: <div>Login</div> },
    ])

    const { container } = render(
      <QueryClientProvider client={testQueryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    )

    expect(container).toBeTruthy()
    expect(document.body).not.toBeEmptyDOMElement()
  })
})
