import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { BuildingBlock, Module } from '@/lib/types';
import {
  CONTENT_SAVE_DEBOUNCE_MS,
  SAVED_INDICATOR_LINGER_MS,
  useModuleContentMutation,
} from './useModuleContentMutation';
import { pageModulesQueryKey } from './usePageModules';

vi.mock('@/api/modules', () => ({
  updateModuleFull: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

import { updateModuleFull } from '@/api/modules';
import { toast } from 'sonner';

const mockedUpdate = vi.mocked(updateModuleFull);
const mockedToast = vi.mocked(toast);

const PAGE_ID = 'page-1';
const MODULE_ID = 'module-1';

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    id: MODULE_ID,
    lessonPageId: PAGE_ID,
    moduleType: 'Theory',
    gridX: 0,
    gridY: 0,
    gridWidth: 4,
    gridHeight: 4,
    zIndex: 1,
    content: [{ type: 'Text', spans: [{ text: 'old', bold: false }] }],
    ...overrides,
  };
}

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

function nextContent(text: string): BuildingBlock[] {
  return [{ type: 'Text', spans: [{ text, bold: false }] }];
}

describe('useModuleContentMutation', () => {
  let client: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    mockedUpdate.mockReset();
    mockedToast.error.mockReset();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(pageModulesQueryKey(PAGE_ID), [makeModule()]);
  });

  afterEach(() => {
    vi.useRealTimers();
    client.clear();
  });

  it('schedule applies optimistic content and fires PUT after the debounce window', async () => {
    mockedUpdate.mockResolvedValueOnce(makeModule({ content: nextContent('hi') }));
    const { result } = renderHook(
      () => useModuleContentMutation({ pageId: PAGE_ID, moduleId: MODULE_ID }),
      { wrapper: makeWrapper(client) },
    );
    act(() => {
      result.current.schedule(nextContent('hi'));
    });
    // Optimistic immediately
    const cached = client.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID));
    expect(cached?.[0].content).toEqual(nextContent('hi'));
    expect(mockedUpdate).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(CONTENT_SAVE_DEBOUNCE_MS);
      // Drain microtasks so the .then chain settles.
      await Promise.resolve();
    });
    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    expect(mockedUpdate).toHaveBeenCalledWith(MODULE_ID, expect.objectContaining({
      moduleType: 'Theory',
      content: nextContent('hi'),
    }));
  });

  it('coalesces 5 rapid schedules into a single PUT with the latest content', async () => {
    mockedUpdate.mockResolvedValueOnce(makeModule({ content: nextContent('5') }));
    const { result } = renderHook(
      () => useModuleContentMutation({ pageId: PAGE_ID, moduleId: MODULE_ID }),
      { wrapper: makeWrapper(client) },
    );
    act(() => {
      for (const v of ['1', '2', '3', '4', '5']) {
        result.current.schedule(nextContent(v));
        vi.advanceTimersByTime(100);
      }
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(CONTENT_SAVE_DEBOUNCE_MS);
      await Promise.resolve();
    });
    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    expect(mockedUpdate).toHaveBeenCalledWith(
      MODULE_ID,
      expect.objectContaining({ content: nextContent('5') }),
    );
  });

  it('on 422 INVALID_BUILDING_BLOCK keeps optimistic cache and surfaces translated toast', async () => {
    mockedUpdate.mockRejectedValueOnce({
      response: { data: { code: 'INVALID_BUILDING_BLOCK', message: 'server msg' } },
    });
    const { result } = renderHook(
      () => useModuleContentMutation({ pageId: PAGE_ID, moduleId: MODULE_ID }),
      { wrapper: makeWrapper(client) },
    );
    act(() => result.current.schedule(nextContent('bad')));
    await act(async () => {
      vi.advanceTimersByTime(CONTENT_SAVE_DEBOUNCE_MS);
      await Promise.resolve();
      await Promise.resolve();
    });
    // Cache stays at user's edit (NOT rolled back).
    const cached = client.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID));
    expect(cached?.[0].content).toEqual(nextContent('bad'));
    expect(mockedToast.error).toHaveBeenCalledWith('editor.errors.invalidBuildingBlock');
    expect(result.current.status).toBe('failed');
  });

  it('on 422 BREADCRUMB_CONTENT_NOT_EMPTY surfaces the breadcrumb-specific translated message', async () => {
    mockedUpdate.mockRejectedValueOnce({
      response: { data: { code: 'BREADCRUMB_CONTENT_NOT_EMPTY' } },
    });
    const { result } = renderHook(
      () => useModuleContentMutation({ pageId: PAGE_ID, moduleId: MODULE_ID }),
      { wrapper: makeWrapper(client) },
    );
    act(() => result.current.schedule(nextContent('x')));
    await act(async () => {
      vi.advanceTimersByTime(CONTENT_SAVE_DEBOUNCE_MS);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedToast.error).toHaveBeenCalledWith('editor.errors.breadcrumbContentNotEmpty');
  });

  it('flush fires PUT immediately and returns the in-flight promise', async () => {
    mockedUpdate.mockResolvedValueOnce(makeModule({ content: nextContent('flushed') }));
    const { result } = renderHook(
      () => useModuleContentMutation({ pageId: PAGE_ID, moduleId: MODULE_ID }),
      { wrapper: makeWrapper(client) },
    );
    act(() => result.current.schedule(nextContent('flushed')));
    let p: Promise<Module> | undefined;
    act(() => {
      p = result.current.flush();
    });
    expect(p).toBeDefined();
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    const saved = await p!;
    expect(saved.content).toEqual(nextContent('flushed'));
  });

  it('cancel drops pending PUT — no network call after debounce expires', async () => {
    const { result } = renderHook(
      () => useModuleContentMutation({ pageId: PAGE_ID, moduleId: MODULE_ID }),
      { wrapper: makeWrapper(client) },
    );
    act(() => {
      result.current.schedule(nextContent('won-t-save'));
      result.current.cancel();
    });
    await act(async () => {
      vi.advanceTimersByTime(CONTENT_SAVE_DEBOUNCE_MS * 2);
      await Promise.resolve();
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('revertOptimistic restores the pre-edit cache snapshot', async () => {
    const { result } = renderHook(
      () => useModuleContentMutation({ pageId: PAGE_ID, moduleId: MODULE_ID }),
      { wrapper: makeWrapper(client) },
    );
    act(() => result.current.schedule(nextContent('dirty')));
    expect(
      client.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID))?.[0].content,
    ).toEqual(nextContent('dirty'));

    act(() => result.current.revertOptimistic());
    const cached = client.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID));
    expect(cached?.[0].content).toEqual([
      { type: 'Text', spans: [{ text: 'old', bold: false }] },
    ]);
    expect(result.current.status).toBe('idle');
  });

  it('unmount drops pending PUT (cleanup)', async () => {
    const { result, unmount } = renderHook(
      () => useModuleContentMutation({ pageId: PAGE_ID, moduleId: MODULE_ID }),
      { wrapper: makeWrapper(client) },
    );
    act(() => result.current.schedule(nextContent('orphan')));
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(CONTENT_SAVE_DEBOUNCE_MS * 2);
      await Promise.resolve();
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('round-trip: server response replaces optimistic cache and status transitions saving→saved→idle', async () => {
    mockedUpdate.mockResolvedValueOnce(
      makeModule({ content: nextContent('hi'), zIndex: 99 }),
    );
    const { result } = renderHook(
      () => useModuleContentMutation({ pageId: PAGE_ID, moduleId: MODULE_ID }),
      { wrapper: makeWrapper(client) },
    );
    act(() => result.current.schedule(nextContent('hi')));
    await act(async () => {
      vi.advanceTimersByTime(CONTENT_SAVE_DEBOUNCE_MS);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.status).toBe('saved');
    const cached = client.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID));
    expect(cached?.[0].zIndex).toBe(99);

    await act(async () => {
      vi.advanceTimersByTime(SAVED_INDICATOR_LINGER_MS);
      await Promise.resolve();
    });
    expect(result.current.status).toBe('idle');
  });
});

