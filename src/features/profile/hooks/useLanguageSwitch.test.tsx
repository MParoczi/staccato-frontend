import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import i18next from 'i18next';
import '@/i18n';
import { useLanguageSwitch } from './useLanguageSwitch';
import type { User } from '@/lib/types';

const mockUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  language: 'en',
  defaultPageSize: 'A4',
  defaultInstrumentId: 'inst-1',
  avatarUrl: null,
  scheduledDeletionAt: null,
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  void i18next.changeLanguage('en');
});
afterAll(() => server.close());

function createWrapper({ seedProfile }: { seedProfile: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  if (seedProfile) {
    queryClient.setQueryData<User>(['user', 'profile'], { ...mockUser });
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe('useLanguageSwitch', () => {
  it('sends PUT with cached firstName/lastName when profile is loaded', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.put('http://localhost:5000/users/me', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          { ...mockUser, language: 'hu' },
          { status: 200 },
        );
      }),
    );

    const { Wrapper } = createWrapper({ seedProfile: true });
    const { result } = renderHook(() => useLanguageSwitch(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate('hu');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedBody).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      language: 'hu',
      defaultPageSize: 'A4',
      defaultInstrumentId: 'inst-1',
    });
  });

  it('does not fire a PUT when the profile cache is cold, but still changes i18next', async () => {
    let putCalled = false;
    server.use(
      http.put('http://localhost:5000/users/me', () => {
        putCalled = true;
        return HttpResponse.json(mockUser, { status: 200 });
      }),
    );

    const { Wrapper } = createWrapper({ seedProfile: false });
    const { result } = renderHook(() => useLanguageSwitch(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate('hu');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(putCalled).toBe(false);
    expect(i18next.language).toBe('hu');
  });
});
