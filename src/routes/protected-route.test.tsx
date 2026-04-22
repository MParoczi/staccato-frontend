import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProtectedRoute } from './protected-route';
import { useAuthStore } from '@/stores/authStore';

vi.mock('@/api/auth', () => ({
  silentRefresh: vi.fn(() => new Promise(() => {})),
}));

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<div>protected content</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({
    accessToken: null,
    expiresAt: null,
    isLoggingOut: false,
  });
});

afterEach(() => {
  useAuthStore.setState({
    accessToken: null,
    expiresAt: null,
    isLoggingOut: false,
  });
});

describe('ProtectedRoute', () => {
  it('redirects to /login when token is cleared while status is idle', () => {
    useAuthStore.setState({ accessToken: 'token-1', expiresAt: Date.now() + 60_000 });
    renderProtected();
    expect(screen.getByText('protected content')).toBeInTheDocument();

    act(() => {
      useAuthStore.setState({ accessToken: null, expiresAt: null, isLoggingOut: false });
    });

    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('shows loader while refreshing when starting without a token', () => {
    renderProtected();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });
});
