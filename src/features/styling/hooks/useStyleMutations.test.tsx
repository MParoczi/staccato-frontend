import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import {
  useApplyPresetToNotebook,
  useSaveNotebookStyles,
} from './useStyleMutations';
import type {
  NotebookModuleStyle,
  UpdateNotebookStyleInput,
} from '@/lib/types';

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

const notebookId = 'nb-1';

function makeStyle(
  moduleType: NotebookModuleStyle['moduleType'],
  overrides: Partial<NotebookModuleStyle> = {},
): NotebookModuleStyle {
  return {
    id: `${moduleType}-id`,
    notebookId,
    moduleType,
    backgroundColor: '#FFFFFF',
    borderColor: '#CCCCCC',
    borderStyle: 'Solid',
    borderWidth: 1,
    borderRadius: 4,
    headerBgColor: '#F0E6D3',
    headerTextColor: '#333333',
    bodyTextColor: '#333333',
    fontFamily: 'Default',
    ...overrides,
  };
}

const initialStyles: NotebookModuleStyle[] = [
  makeStyle('Theory'),
  makeStyle('Practice', { backgroundColor: '#AA0011' }),
];

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  toastSuccess.mockClear();
  toastError.mockClear();
});
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(
    ['notebooks', notebookId, 'styles'],
    [...initialStyles],
  );
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}

describe('useSaveNotebookStyles', () => {
  it('optimistically updates the cache and commits server response on success', async () => {
    const serverResponse: NotebookModuleStyle[] = [
      makeStyle('Theory', { backgroundColor: '#123456' }),
    ];
    server.use(
      http.put(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(serverResponse, { status: 200 }),
      ),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useSaveNotebookStyles(notebookId), {
      wrapper: Wrapper,
    });

    const input: UpdateNotebookStyleInput[] = [
      {
        moduleType: 'Theory',
        backgroundColor: '#123456',
        borderColor: '#CCCCCC',
        borderStyle: 'Solid',
        borderWidth: 1,
        borderRadius: 4,
        headerBgColor: '#F0E6D3',
        headerTextColor: '#333333',
        bodyTextColor: '#333333',
        fontFamily: 'Default',
      },
    ];

    act(() => {
      result.current.mutate(input);
    });

    // Optimistic update visible immediately
    await waitFor(() => {
      const cached = queryClient.getQueryData<NotebookModuleStyle[]>([
        'notebooks',
        notebookId,
        'styles',
      ]);
      expect(cached?.[0]?.backgroundColor).toBe('#123456');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toastSuccess).toHaveBeenCalledWith('styling.drawer.saveSuccess');
  });

  it('rolls back cache on error and shows destructive toast', async () => {
    server.use(
      http.put(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json({ message: 'fail' }, { status: 500 }),
      ),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useSaveNotebookStyles(notebookId), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate([
        {
          moduleType: 'Theory',
          backgroundColor: '#123456',
          borderColor: '#CCCCCC',
          borderStyle: 'Solid',
          borderWidth: 1,
          borderRadius: 4,
          headerBgColor: '#F0E6D3',
          headerTextColor: '#333333',
          bodyTextColor: '#333333',
          fontFamily: 'Default',
        },
      ]);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<NotebookModuleStyle[]>([
      'notebooks',
      notebookId,
      'styles',
    ]);
    expect(cached?.[0]?.backgroundColor).toBe('#FFFFFF');
    expect(toastError).toHaveBeenCalledWith('styling.drawer.saveError');
  });
});

describe('useApplyPresetToNotebook', () => {
  it('applies preset, updates cache with server data, and shows success toast', async () => {
    const applied: NotebookModuleStyle[] = [
      makeStyle('Theory', { backgroundColor: '#ABCDEF' }),
    ];
    server.use(
      http.post(
        `http://localhost:5000/notebooks/${notebookId}/styles/apply-preset/preset-1`,
        () => HttpResponse.json(applied, { status: 200 }),
      ),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useApplyPresetToNotebook(notebookId), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate('preset-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<NotebookModuleStyle[]>([
      'notebooks',
      notebookId,
      'styles',
    ]);
    expect(cached?.[0]?.backgroundColor).toBe('#ABCDEF');
    expect(toastSuccess).toHaveBeenCalledWith('styling.drawer.applySuccess');
  });

  it('restores previous cache and shows error toast on failure', async () => {
    server.use(
      http.post(
        `http://localhost:5000/notebooks/${notebookId}/styles/apply-preset/preset-1`,
        () => HttpResponse.json({ message: 'nope' }, { status: 404 }),
      ),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useApplyPresetToNotebook(notebookId), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate('preset-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<NotebookModuleStyle[]>([
      'notebooks',
      notebookId,
      'styles',
    ]);
    expect(cached).toEqual(initialStyles);
    expect(toastError).toHaveBeenCalledWith('styling.drawer.applyError');
  });
});
