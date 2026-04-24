import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { pageModulesQueryKey, usePageModules } from './usePageModules';
import type { Module } from '@/lib/types';

const sampleModule: Module = {
  id: 'module-1',
  lessonPageId: 'page-1',
  moduleType: 'Theory',
  gridX: 0,
  gridY: 0,
  gridWidth: 8,
  gridHeight: 5,
  zIndex: 0,
  content: [],
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe('pageModulesQueryKey', () => {
  it('returns the documented hierarchical key', () => {
    expect(pageModulesQueryKey('page-1')).toEqual(['pages', 'page-1', 'modules']);
  });

  it('produces distinct keys per page id', () => {
    expect(pageModulesQueryKey('a')).not.toEqual(pageModulesQueryKey('b'));
  });
});

describe('usePageModules', () => {
  it('fetches modules for the given page and stores them under the documented key', async () => {
    server.use(
      http.get('http://localhost:5000/pages/page-1/modules', () => {
        return HttpResponse.json([sampleModule]);
      }),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => usePageModules('page-1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([sampleModule]);
    expect(queryClient.getQueryData(['pages', 'page-1', 'modules'])).toEqual([
      sampleModule,
    ]);
  });

  it('does not fetch when pageId is undefined', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePageModules(undefined), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});
