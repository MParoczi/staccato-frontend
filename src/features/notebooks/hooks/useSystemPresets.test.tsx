import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useSystemPresets } from './useSystemPresets';
import type { SystemStylePreset } from '@/lib/types';

const mockPresets: SystemStylePreset[] = [
  {
    id: 'preset-1',
    name: 'Colorful',
    displayOrder: 1,
    isDefault: true,
    styles: [],
  },
  {
    id: 'preset-2',
    name: 'Monochrome',
    displayOrder: 2,
    isDefault: false,
    styles: [],
  },
];

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useSystemPresets', () => {
  it('does not fetch when enabled is false (default)', async () => {
    let requestCount = 0;
    server.use(
      http.get('http://localhost:5000/presets/system', () => {
        requestCount++;
        return HttpResponse.json(mockPresets);
      }),
    );

    const { result } = renderHook(() => useSystemPresets(), {
      wrapper: createWrapper(),
    });

    // Wait a tick to ensure no request fires
    await new Promise((r) => setTimeout(r, 50));

    expect(requestCount).toBe(0);
    expect(result.current.data).toBeUndefined();
  });

  it('fetches when enabled is true', async () => {
    server.use(
      http.get('http://localhost:5000/presets/system', () => {
        return HttpResponse.json(mockPresets);
      }),
    );

    const { result } = renderHook(
      () => useSystemPresets({ enabled: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPresets);
    expect(result.current.data).toHaveLength(2);
  });

  it('uses staleTime 300_000 and query key ["presets"]', () => {
    server.use(
      http.get('http://localhost:5000/presets/system', () => {
        return HttpResponse.json([]);
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    renderHook(() => useSystemPresets({ enabled: true }), { wrapper: Wrapper });

    const queryState = queryClient.getQueryCache().findAll({
      queryKey: ['presets'],
    });

    expect(queryState).toHaveLength(1);
    expect(queryState[0].options.staleTime).toBe(300_000);
  });
});
