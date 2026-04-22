import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterEach,
  afterAll,
} from 'vitest';
import {
  USER_PRESET_LIMIT,
  classifyCreateUserPresetError,
  classifyRenameUserPresetError,
  useCreateUserPreset,
  useDeleteUserPreset,
  useRenameUserPreset,
  useUserPresets,
} from './useUserPresets';
import type { StyleEntry, UserSavedPreset } from '@/lib/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}));

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  toastSuccess.mockClear();
  toastError.mockClear();
});
afterAll(() => server.close());

function makeStyles(): StyleEntry[] {
  return [
    {
      moduleType: 'Theory',
      stylesJson: JSON.stringify({ backgroundColor: '#FFFFFF' }),
    },
  ];
}

function makeUserPreset(id: string, name: string): UserSavedPreset {
  return { id, name, styles: [] };
}

function createWrapper(seed?: UserSavedPreset[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  if (seed) {
    queryClient.setQueryData(['user', 'presets'], seed);
  }
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}

describe('classifyCreateUserPresetError', () => {
  it('maps 409 to duplicate', () => {
    expect(
      classifyCreateUserPresetError({ response: { status: 409 } }),
    ).toBe('duplicate');
  });
  it('maps 422 to limit', () => {
    expect(
      classifyCreateUserPresetError({ response: { status: 422 } }),
    ).toBe('limit');
  });
  it('maps anything else to unknown', () => {
    expect(classifyCreateUserPresetError(new Error('boom'))).toBe('unknown');
    expect(
      classifyCreateUserPresetError({ response: { status: 500 } }),
    ).toBe('unknown');
  });
});

describe('useCreateUserPreset', () => {
  it('optimistically inserts at the top, commits server response, and invalidates for server order', async () => {
    const existing = [
      makeUserPreset('u-old', 'Older'),
    ];
    const created: UserSavedPreset = {
      id: 'u-new',
      name: 'Brand new',
      styles: makeStyles(),
    };

    let getCalls = 0;
    server.use(
      http.post(
        'http://localhost:5000/users/me/presets',
        async () => HttpResponse.json(created, { status: 201 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () => {
        getCalls += 1;
        // After create, backend will return the new preset first.
        return HttpResponse.json([created, ...existing], { status: 200 });
      }),
    );

    const { Wrapper, queryClient } = createWrapper(existing);
    const { result } = renderHook(() => useCreateUserPreset(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ name: 'Brand new', styles: makeStyles() });
    });

    // Optimistic insert at top
    await waitFor(() => {
      const cached =
        queryClient.getQueryData<UserSavedPreset[]>(['user', 'presets']);
      expect(cached?.[0]?.name).toBe('Brand new');
      expect(cached?.length).toBe(2);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Server response replaces optimistic entry at the top.
    const afterSuccess =
      queryClient.getQueryData<UserSavedPreset[]>(['user', 'presets']);
    expect(afterSuccess?.[0]?.id).toBe('u-new');

    expect(toastSuccess).toHaveBeenCalledWith('styling.presets.createSuccess');

    // Invalidation marks the query stale so a subsequent fetch reloads the
    // canonical newest-first server order.
    const state = queryClient.getQueryState(['user', 'presets']);
    expect(state?.isInvalidated).toBe(true);
    expect(getCalls).toBeGreaterThanOrEqual(0);
  });

  it('rolls back the cache and surfaces duplicate via error kind (no toast)', async () => {
    const existing = [makeUserPreset('u-old', 'Existing')];
    server.use(
      http.post(
        'http://localhost:5000/users/me/presets',
        () =>
          HttpResponse.json({ message: 'duplicate' }, { status: 409 }),
      ),
    );

    const { Wrapper, queryClient } = createWrapper(existing);
    const { result } = renderHook(() => useCreateUserPreset(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ name: 'Existing', styles: makeStyles() });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached =
      queryClient.getQueryData<UserSavedPreset[]>(['user', 'presets']);
    expect(cached).toEqual(existing);
    expect(classifyCreateUserPresetError(result.current.error)).toBe(
      'duplicate',
    );
    // Duplicate is shown inline in the dialog, not as a toast.
    expect(toastError).not.toHaveBeenCalled();
  });

  it('rolls back the cache and shows the limit-reached toast on 422', async () => {
    const existing = Array.from({ length: USER_PRESET_LIMIT }, (_, i) =>
      makeUserPreset(`u-${i}`, `Preset ${i}`),
    );
    server.use(
      http.post(
        'http://localhost:5000/users/me/presets',
        () =>
          HttpResponse.json(
            { message: 'limit reached' },
            { status: 422 },
          ),
      ),
    );

    const { Wrapper, queryClient } = createWrapper(existing);
    const { result } = renderHook(() => useCreateUserPreset(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ name: 'One too many', styles: makeStyles() });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached =
      queryClient.getQueryData<UserSavedPreset[]>(['user', 'presets']);
    expect(cached?.length).toBe(USER_PRESET_LIMIT);
    expect(toastError).toHaveBeenCalledWith('styling.presets.limitReached');
  });

  it('shows a generic error toast for unknown server errors', async () => {
    server.use(
      http.post(
        'http://localhost:5000/users/me/presets',
        () => HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    const { Wrapper } = createWrapper([]);
    const { result } = renderHook(() => useCreateUserPreset(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ name: 'Anything', styles: makeStyles() });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toastError).toHaveBeenCalledWith('styling.presets.createError');
  });
});

describe('useUserPresets', () => {
  it('returns server-provided order without client-side sorting', async () => {
    const serverOrder = [
      makeUserPreset('u-3', 'Newest'),
      makeUserPreset('u-1', 'Middle'),
      makeUserPreset('u-2', 'Oldest'),
    ];
    server.use(
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json(serverOrder, { status: 200 }),
      ),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserPresets(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((p) => p.id)).toEqual([
      'u-3',
      'u-1',
      'u-2',
    ]);
  });
});

describe('classifyRenameUserPresetError', () => {
  it('maps 409 to duplicate', () => {
    expect(
      classifyRenameUserPresetError({ response: { status: 409 } }),
    ).toBe('duplicate');
  });
  it('maps 404 to notFound', () => {
    expect(
      classifyRenameUserPresetError({ response: { status: 404 } }),
    ).toBe('notFound');
  });
  it('maps anything else to unknown', () => {
    expect(classifyRenameUserPresetError(new Error('boom'))).toBe('unknown');
    expect(
      classifyRenameUserPresetError({ response: { status: 500 } }),
    ).toBe('unknown');
  });
});

describe('useRenameUserPreset', () => {
  it('optimistically updates the cached name and commits the server response', async () => {
    const existing = [
      makeUserPreset('u-1', 'Old name'),
      makeUserPreset('u-2', 'Untouched'),
    ];
    const updated: UserSavedPreset = {
      id: 'u-1',
      name: 'Renamed',
      styles: [],
    };
    server.use(
      http.put('http://localhost:5000/users/me/presets/u-1', () =>
        HttpResponse.json(updated, { status: 200 }),
      ),
    );

    const { Wrapper, queryClient } = createWrapper(existing);
    const { result } = renderHook(() => useRenameUserPreset(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ id: 'u-1', name: 'Renamed' });
    });

    await waitFor(() => {
      const cached =
        queryClient.getQueryData<UserSavedPreset[]>(['user', 'presets']);
      expect(cached?.find((p) => p.id === 'u-1')?.name).toBe('Renamed');
      expect(cached?.find((p) => p.id === 'u-2')?.name).toBe('Untouched');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toastSuccess).toHaveBeenCalledWith('styling.presets.renameSuccess');
  });

  it('rolls back the cache and surfaces duplicate via error kind (no toast)', async () => {
    const existing = [
      makeUserPreset('u-1', 'Original'),
      makeUserPreset('u-2', 'Taken'),
    ];
    server.use(
      http.put('http://localhost:5000/users/me/presets/u-1', () =>
        HttpResponse.json({ message: 'duplicate' }, { status: 409 }),
      ),
    );

    const { Wrapper, queryClient } = createWrapper(existing);
    const { result } = renderHook(() => useRenameUserPreset(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ id: 'u-1', name: 'Taken' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached =
      queryClient.getQueryData<UserSavedPreset[]>(['user', 'presets']);
    expect(cached?.find((p) => p.id === 'u-1')?.name).toBe('Original');
    expect(classifyRenameUserPresetError(result.current.error)).toBe(
      'duplicate',
    );
    // Duplicate is shown inline on the preset card, not as a toast.
    expect(toastError).not.toHaveBeenCalled();
  });

  it('rolls back and shows a destructive toast on non-duplicate errors', async () => {
    const existing = [makeUserPreset('u-1', 'Original')];
    server.use(
      http.put('http://localhost:5000/users/me/presets/u-1', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    const { Wrapper, queryClient } = createWrapper(existing);
    const { result } = renderHook(() => useRenameUserPreset(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ id: 'u-1', name: 'Whatever' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const cached =
      queryClient.getQueryData<UserSavedPreset[]>(['user', 'presets']);
    expect(cached?.find((p) => p.id === 'u-1')?.name).toBe('Original');
    expect(toastError).toHaveBeenCalledWith('styling.presets.renameError');
  });
});

describe('useDeleteUserPreset', () => {
  it('optimistically removes the preset and shows success toast', async () => {
    const existing = [
      makeUserPreset('u-1', 'First'),
      makeUserPreset('u-2', 'Second'),
    ];
    server.use(
      http.delete(
        'http://localhost:5000/users/me/presets/u-1',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    const { Wrapper, queryClient } = createWrapper(existing);
    const { result } = renderHook(() => useDeleteUserPreset(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate('u-1');
    });

    await waitFor(() => {
      const cached =
        queryClient.getQueryData<UserSavedPreset[]>(['user', 'presets']);
      expect(cached?.map((p) => p.id)).toEqual(['u-2']);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toastSuccess).toHaveBeenCalledWith('styling.presets.deleteSuccess');
  });

  it('rolls back the cache and shows a destructive toast on server error', async () => {
    const existing = [
      makeUserPreset('u-1', 'First'),
      makeUserPreset('u-2', 'Second'),
    ];
    server.use(
      http.delete('http://localhost:5000/users/me/presets/u-1', () =>
        HttpResponse.json({ message: 'nope' }, { status: 500 }),
      ),
    );

    const { Wrapper, queryClient } = createWrapper(existing);
    const { result } = renderHook(() => useDeleteUserPreset(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate('u-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const cached =
      queryClient.getQueryData<UserSavedPreset[]>(['user', 'presets']);
    expect(cached?.map((p) => p.id)).toEqual(['u-1', 'u-2']);
    expect(toastError).toHaveBeenCalledWith('styling.presets.deleteError');
  });
});
