import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRef, type ReactNode } from 'react';
import type { Module } from '@/lib/types';
import { ModuleEditor, type ModuleEditorHandle } from './ModuleEditor';
import { pageModulesQueryKey } from '@/features/notebooks/hooks/usePageModules';

vi.mock('@/api/modules', () => ({ updateModuleFull: vi.fn() }));
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

import { updateModuleFull } from '@/api/modules';
import { toast } from 'sonner';

const mockedUpdate = vi.mocked(updateModuleFull);
const mockedToast = vi.mocked(toast);

// jsdom polyfills for dnd-kit
class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  if (!('ResizeObserver' in globalThis)) {
    (globalThis as unknown as { ResizeObserver: typeof StubResizeObserver }).ResizeObserver =
      StubResizeObserver;
  }
});

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
    zIndex: 0,
    content: [{ type: 'Text', spans: [{ text: 'hello', bold: false }] }],
    ...overrides,
  };
}

function makeQc(initial: Module[]): QueryClient {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  qc.setQueryData<Module[]>(pageModulesQueryKey(PAGE_ID), initial);
  return qc;
}

function Wrapper({
  qc,
  children,
}: {
  qc: QueryClient;
  children: ReactNode;
}) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('ModuleEditor', () => {
  it('renders toolbar + Text block for a Theory module', () => {
    const m = makeModule();
    const qc = makeQc([m]);
    render(
      <Wrapper qc={qc}>
        <ModuleEditor module={m} onExitEditMode={() => undefined} />
      </Wrapper>,
    );
    expect(screen.getByRole('toolbar', { name: 'editor.edit' })).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeEnabled();
  });

  it('Breadcrumb modules render BreadcrumbEmptyState and disable Save/AddBlock', () => {
    const m = makeModule({ moduleType: 'Breadcrumb', content: [] });
    const qc = makeQc([m]);
    render(
      <Wrapper qc={qc}>
        <ModuleEditor module={m} onExitEditMode={() => undefined} />
      </Wrapper>,
    );
    expect(screen.getByRole('note', { name: 'editor.breadcrumbAutoGen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'editor.addBlock' })).toBeDisabled();
  });

  it('Title module Add Block popover lists exactly Date and Text', async () => {
    const user = userEvent.setup();
    const m = makeModule({ moduleType: 'Title', content: [] });
    const qc = makeQc([m]);
    render(
      <Wrapper qc={qc}>
        <ModuleEditor module={m} onExitEditMode={() => undefined} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: 'editor.addBlock' }));
    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(2);
  });

  it('Add Block adds a row, schedules optimistic cache update, and pushes history', async () => {
    const user = userEvent.setup();
    const m = makeModule({ content: [] });
    const qc = makeQc([m]);
    render(
      <Wrapper qc={qc}>
        <ModuleEditor module={m} onExitEditMode={() => undefined} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: 'editor.addBlock' }));
    const textOption = await screen.findByRole('option', { name: /editor\.blockType\.text/i });
    await user.click(textOption);

    // Optimistic cache reflects the new block.
    const cached = qc.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID));
    expect(cached?.[0].content).toHaveLength(1);
    expect(cached?.[0].content[0].type).toBe('Text');
    // Undo button now enabled.
    expect(screen.getByRole('button', { name: 'editor.undo' })).toBeEnabled();
  });

  it('schedules a debounced PUT (1000ms) on edits via flush', async () => {
    vi.useFakeTimers();
    mockedUpdate.mockResolvedValue({
      ...makeModule(),
      content: [{ type: 'Text', spans: [{ text: 'hello', bold: false }] }],
    });

    const m = makeModule({ content: [] });
    const qc = makeQc([m]);
    const handleRef = createRef<ModuleEditorHandle>();

    render(
      <Wrapper qc={qc}>
        <ModuleEditor ref={handleRef} module={m} onExitEditMode={() => undefined} />
      </Wrapper>,
    );

    // Add a Text block (immediate history push + scheduled save).
    await act(async () => {
      // userEvent doesn't play well with fake timers; click directly.
      screen.getByRole('button', { name: 'editor.addBlock' }).click();
    });
    // Advance microtasks
    await act(async () => {
      await Promise.resolve();
    });
    const option = screen.getByRole('option', { name: /editor\.blockType\.text/i });
    await act(async () => {
      option.click();
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockedUpdate).toHaveBeenCalledTimes(1);
  });

  it('Cancel button reverts cache to pre-edit snapshot and exits edit mode', async () => {
    const user = userEvent.setup();
    const m = makeModule({ content: [] });
    const qc = makeQc([m]);
    const onExit = vi.fn();
    render(
      <Wrapper qc={qc}>
        <ModuleEditor module={m} onExitEditMode={onExit} />
      </Wrapper>,
    );
    // Add a block to capture snapshot + dirty cache
    await user.click(screen.getByRole('button', { name: 'editor.addBlock' }));
    await user.click(await screen.findByRole('option', { name: /editor\.blockType\.text/i }));
    expect(qc.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID))?.[0].content).toHaveLength(1);
    // Click Cancel
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(qc.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID))?.[0].content).toHaveLength(0);
    expect(onExit).toHaveBeenCalled();
  });

  it('Save with no pending edits exits immediately', async () => {
    const user = userEvent.setup();
    const m = makeModule();
    const qc = makeQc([m]);
    const onExit = vi.fn();
    render(
      <Wrapper qc={qc}>
        <ModuleEditor module={m} onExitEditMode={onExit} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: 'common.save' }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('Save flushes pending PUT and exits on success', async () => {
    mockedUpdate.mockResolvedValue({
      ...makeModule(),
      content: [
        { type: 'Text', spans: [{ text: 'hello', bold: false }] },
        { type: 'Text', spans: [{ text: '', bold: false }] },
      ],
    });
    const user = userEvent.setup();
    const m = makeModule();
    const qc = makeQc([m]);
    const onExit = vi.fn();
    render(
      <Wrapper qc={qc}>
        <ModuleEditor module={m} onExitEditMode={onExit} />
      </Wrapper>,
    );
    // Dirty: add a block
    await user.click(screen.getByRole('button', { name: 'editor.addBlock' }));
    await user.click(await screen.findByRole('option', { name: /editor\.blockType\.text/i }));
    // Save (will flush + await PUT)
    await user.click(screen.getByRole('button', { name: 'common.save' }));
    await waitFor(() => expect(mockedUpdate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
  });

  it('imperative ref.flush() returns in-flight promise; ref.cancel() reverts cache', async () => {
    mockedUpdate.mockResolvedValue({ ...makeModule() });
    const user = userEvent.setup();
    const m = makeModule({ content: [] });
    const qc = makeQc([m]);
    const handle = createRef<ModuleEditorHandle>();
    render(
      <Wrapper qc={qc}>
        <ModuleEditor ref={handle} module={m} onExitEditMode={() => undefined} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: 'editor.addBlock' }));
    await user.click(await screen.findByRole('option', { name: /editor\.blockType\.text/i }));

    expect(handle.current).not.toBeNull();
    const promise = handle.current!.flush();
    expect(promise).toBeInstanceOf(Promise);
    await promise;
    expect(mockedUpdate).toHaveBeenCalledTimes(1);

    handle.current!.cancel();
    expect(qc.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID))?.[0].content).toHaveLength(0);
  });

  it('Delete on a non-empty Text block opens DeleteBlockDialog; Confirm removes block', async () => {
    const user = userEvent.setup();
    const m = makeModule({
      content: [{ type: 'Text', spans: [{ text: 'cant lose me', bold: false }] }],
    });
    const qc = makeQc([m]);
    render(
      <Wrapper qc={qc}>
        <ModuleEditor module={m} onExitEditMode={() => undefined} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: 'editor.deleteBlock' }));
    expect(await screen.findByText('editor.deleteBlockTitle')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'editor.deleteBlockConfirm' }));
    expect(qc.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID))?.[0].content).toHaveLength(0);
  });

  it('Delete on an empty Text block removes it without opening the dialog', async () => {
    const user = userEvent.setup();
    const m = makeModule({
      content: [{ type: 'Text', spans: [{ text: '', bold: false }] }],
    });
    const qc = makeQc([m]);
    render(
      <Wrapper qc={qc}>
        <ModuleEditor module={m} onExitEditMode={() => undefined} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: 'editor.deleteBlock' }));
    expect(screen.queryByText('editor.deleteBlockTitle')).toBeNull();
    expect(qc.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID))?.[0].content).toHaveLength(0);
  });

  it('422 INVALID_BUILDING_BLOCK surfaces translated toast and keeps optimistic cache', async () => {
    mockedUpdate.mockRejectedValue({
      response: { data: { code: 'INVALID_BUILDING_BLOCK' } },
    });
    const user = userEvent.setup();
    const m = makeModule({ content: [] });
    const qc = makeQc([m]);
    const handle = createRef<ModuleEditorHandle>();
    render(
      <Wrapper qc={qc}>
        <ModuleEditor ref={handle} module={m} onExitEditMode={() => undefined} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: 'editor.addBlock' }));
    await user.click(await screen.findByRole('option', { name: /editor\.blockType\.text/i }));
    await handle.current!.flush()?.catch(() => undefined);
    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith('editor.errors.invalidBuildingBlock'),
    );
    // Cache stays at user's edit (NOT rolled back).
    expect(qc.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID))?.[0].content).toHaveLength(1);
  });

  it('renders edit-glow chrome via data-edit-mode + outline css var', () => {
    const m = makeModule();
    const qc = makeQc([m]);
    const { container } = render(
      <Wrapper qc={qc}>
        <ModuleEditor module={m} onExitEditMode={() => undefined} />
      </Wrapper>,
    );
    const root = container.querySelector('[data-edit-mode="true"]');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-module-id', MODULE_ID);
    const inline = (root as HTMLElement).style;
    expect(inline.outlineColor).toContain('--editor-edit-glow-ring');
    expect(inline.boxShadow).toContain('--editor-edit-glow');
  });
});



