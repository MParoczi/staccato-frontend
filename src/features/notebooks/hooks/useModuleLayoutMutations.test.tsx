import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useModuleLayoutMutations } from './useModuleLayoutMutations';
import type { Module } from '@/lib/types';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

import { toast } from 'sonner';

const initialModule: Module = {
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
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function createWrapper(seed: Module[] = [initialModule]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  queryClient.setQueryData(['pages', 'page-1', 'modules'], [...seed]);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe('useModuleLayoutMutations - updateLayoutMutation', () => {
  it('optimistically merges the new layout into the cached module', async () => {
    server.use(
      http.patch('http://localhost:5000/modules/module-1/layout', async () => {
        return HttpResponse.json({
          ...initialModule,
          gridX: 4,
          gridY: 4,
          zIndex: 2,
        });
      }),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(
      () => useModuleLayoutMutations({ pageId: 'page-1' }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.updateLayoutMutation.mutate({
        moduleId: 'module-1',
        layout: {
          gridX: 4,
          gridY: 4,
          gridWidth: 8,
          gridHeight: 5,
          zIndex: 2,
        },
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Module[]>([
        'pages',
        'page-1',
        'modules',
      ]);
      expect(cached?.[0].gridX).toBe(4);
      expect(cached?.[0].gridY).toBe(4);
      expect(cached?.[0].zIndex).toBe(2);
    });

    await waitFor(() => {
      expect(result.current.updateLayoutMutation.isSuccess).toBe(true);
    });
  });

  it('rolls back the cache and shows a toast when the server rejects the update', async () => {
    server.use(
      http.patch('http://localhost:5000/modules/module-1/layout', () => {
        return HttpResponse.json(
          { message: 'overlap' },
          { status: 400 },
        );
      }),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(
      () => useModuleLayoutMutations({ pageId: 'page-1' }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.updateLayoutMutation.mutate({
        moduleId: 'module-1',
        layout: {
          gridX: 99,
          gridY: 99,
          gridWidth: 8,
          gridHeight: 5,
          zIndex: 0,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.updateLayoutMutation.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<Module[]>([
      'pages',
      'page-1',
      'modules',
    ]);
    expect(cached?.[0]).toEqual(initialModule);
    expect(toast.error).toHaveBeenCalledWith('overlap');
  });
});

describe('useModuleLayoutMutations - createModuleMutation', () => {
  it('optimistically appends a new module and invalidates on settle', async () => {
    server.use(
      http.post('http://localhost:5000/pages/page-1/modules', async () => {
        return HttpResponse.json(
          {
            ...initialModule,
            id: 'module-2',
            gridX: 0,
            gridY: 12,
          },
          { status: 201 },
        );
      }),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(
      () => useModuleLayoutMutations({ pageId: 'page-1' }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.createModuleMutation.mutate({
        moduleType: 'Theory',
        gridX: 0,
        gridY: 12,
        gridWidth: 8,
        gridHeight: 5,
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Module[]>([
        'pages',
        'page-1',
        'modules',
      ]);
      expect(cached).toHaveLength(2);
    });

    await waitFor(() => {
      expect(result.current.createModuleMutation.isSuccess).toBe(true);
    });
  });

  it('rolls back the optimistic insert on server rejection', async () => {
    server.use(
      http.post('http://localhost:5000/pages/page-1/modules', () => {
        return HttpResponse.json(
          { message: 'overlap' },
          { status: 400 },
        );
      }),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(
      () => useModuleLayoutMutations({ pageId: 'page-1' }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.createModuleMutation.mutate({
        moduleType: 'Theory',
        gridX: 0,
        gridY: 0,
        gridWidth: 8,
        gridHeight: 5,
      });
    });

    await waitFor(() => {
      expect(result.current.createModuleMutation.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<Module[]>([
      'pages',
      'page-1',
      'modules',
    ]);
    expect(cached).toHaveLength(1);
    expect(cached?.[0].id).toBe('module-1');
    expect(toast.error).toHaveBeenCalledWith('overlap');
  });
});

describe('useModuleLayoutMutations - deleteModuleMutation', () => {
  it('optimistically removes the module on mutate and resolves on success', async () => {
    server.use(
      http.delete('http://localhost:5000/modules/module-1', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(
      () => useModuleLayoutMutations({ pageId: 'page-1' }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.deleteModuleMutation.mutate('module-1');
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Module[]>([
        'pages',
        'page-1',
        'modules',
      ]);
      expect(cached).toHaveLength(0);
    });

    await waitFor(() => {
      expect(result.current.deleteModuleMutation.isSuccess).toBe(true);
    });
  });

  it('restores the module on error and shows a localized toast', async () => {
    server.use(
      http.delete('http://localhost:5000/modules/module-1', () => {
        return HttpResponse.json({ message: 'nope' }, { status: 500 });
      }),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(
      () => useModuleLayoutMutations({ pageId: 'page-1' }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.deleteModuleMutation.mutate('module-1');
    });

    await waitFor(() => {
      expect(result.current.deleteModuleMutation.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<Module[]>([
      'pages',
      'page-1',
      'modules',
    ]);
    expect(cached).toHaveLength(1);
    expect(toast.error).toHaveBeenCalledWith('nope');
  });
});
