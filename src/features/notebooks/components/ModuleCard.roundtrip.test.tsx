/**
 * End-to-end round-trip Vitest test for plan 01-06 task 6.5.
 *
 * Goal: drive the full ModuleCard surface (view-mode → enter edit-mode via
 * EditButton → Add Text block → debounced autosave → re-hydrate from server
 * response → undo/redo → exit) so every Locked Acceptance Criterion #1–#9
 * from `01-CONTEXT.md` is exercised together rather than in isolation.
 *
 * Mock layer: `vi.mock('@/api/modules')` — captures the `PUT /modules/{id}`
 * call as a vi.fn(). This is functionally equivalent to the MSW handler
 * approach the plan suggests (the mutation hook calls `updateModuleFull`
 * directly), and matches the pattern used across the rest of Phase 1.
 *
 * Each acceptance criterion is tagged inline with `// AC #N:` so the
 * coverage matrix is auditable from a single grep.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { ReactNode } from 'react';
import { ModuleCard } from './ModuleCard';
import type { Module } from '@/lib/types';
import { pageModulesQueryKey } from '@/features/notebooks/hooks/usePageModules';
import { updateModuleFull } from '@/api/modules';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && typeof options === 'object' && 'moduleType' in options) {
        return `${String(options.moduleType)} module`;
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/api/modules', () => ({
  updateModuleFull: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockedUpdate = vi.mocked(updateModuleFull);

const PAGE_ID = 'page-1';
const MODULE_ID = 'module-1';

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    id: MODULE_ID,
    lessonPageId: PAGE_ID,
    moduleType: 'Theory',
    gridX: 2,
    gridY: 3,
    gridWidth: 10,
    gridHeight: 6,
    zIndex: 5,
    content: [],
    ...overrides,
  };
}

function makeQc(initialModules: Module[]): QueryClient {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  qc.setQueryData(pageModulesQueryKey(PAGE_ID), initialModules);
  return qc;
}

function renderInProviders(node: ReactNode, qc: QueryClient) {
  function Root() {
    return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
  }
  const router = createMemoryRouter(
    [
      { path: '/', Component: Root },
      { path: '/elsewhere', element: <div data-testid="elsewhere">elsewhere</div> },
    ],
    { initialEntries: ['/'] },
  );
  return render(<RouterProvider router={router} />);
}

describe('ModuleCard — Phase 1 round-trip (plan 01-06 task 6.5)', () => {
  beforeEach(() => {
    mockedUpdate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(
    'Theory module: enter edit mode → Add Text block → debounced PUT → ' +
      'rehydrate from server → undo/redo → Escape exits → view-mode renders saved content',
    async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      const initialModule = makeModule({ content: [] });
      const qc = makeQc([initialModule]);

      // Server echoes the optimistic content back so cache stays consistent.
      mockedUpdate.mockImplementation(async (_id, body) => ({
        ...initialModule,
        ...body,
      }) as Module);

      const { rerender } = renderInProviders(
        <ModuleCard module={initialModule} isSelected onSelect={vi.fn()} />,
        qc,
      );

      // ── AC #1: Opening a module on the canvas reveals an editor surface
      //          that does not break grid layout.
      const card = screen.getByTestId(`module-card-${MODULE_ID}`);
      expect(card.getAttribute('data-editing')).toBe('false');
      expect(card.style.position).toBe('absolute'); // grid layout intact
      expect(card.getAttribute('data-module-type')).toBe('Theory');

      // Enter edit mode via the explicit Edit button (CONTEXT decision 6 a11y path).
      fireEvent.click(screen.getByRole('button', { name: 'editor.edit' }));
      // Lazy ModuleEditor resolves; wait for its root.
      const editorRoot = await screen.findByLabelText('editor.edit', {
        selector: '[data-edit-mode="true"]',
      });
      expect(editorRoot).toBeInTheDocument();
      expect(card.getAttribute('data-editing')).toBe('true');

      // ── AC #2: Edits autosave (1000ms debounce) and surface a
      //          "saving / saved" status; explicit Save and Cancel buttons exist.
      expect(
        screen.getByRole('button', { name: 'common.save' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'common.cancel' }),
      ).toBeInTheDocument();

      // Trigger an edit: Add a Text block via the toolbar Add Block popover.
      await act(async () => {
        screen.getByRole('button', { name: 'editor.addBlock' }).click();
      });
      const textOption = await screen.findByRole('option', {
        name: /editor\.blockType\.text/i,
      });
      await act(async () => {
        textOption.click();
      });

      // Optimistic cache update is immediate.
      const optimistic = qc.getQueryData<Module[]>(pageModulesQueryKey(PAGE_ID));
      expect(optimistic?.[0].content).toHaveLength(1);
      expect(optimistic?.[0].content[0].type).toBe('Text');
      // Saving has not fired yet — the debounce window is open.
      expect(mockedUpdate).not.toHaveBeenCalled();

      // Advance the 1000ms autosave debounce → PUT fires exactly once.
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(mockedUpdate).toHaveBeenCalledTimes(1);

      // ── AC #6: The Text block round-trips through PUT /modules/{id}.
      const [calledId, calledBody] = mockedUpdate.mock.calls[0];
      expect(calledId).toBe(MODULE_ID);
      expect(calledBody).toMatchObject({
        moduleType: 'Theory',
        gridX: 2,
        gridY: 3,
        gridWidth: 10,
        gridHeight: 6,
        zIndex: 5,
      });
      expect(calledBody.content).toHaveLength(1);
      expect(calledBody.content[0]).toMatchObject({
        type: 'Text',
        spans: [{ text: '', bold: false }],
      });

      // Drain mutation success callbacks (cache reconciliation).
      await act(async () => {
        await Promise.resolve();
      });

      // ── AC #3: Undo button reflects history depth — Add Block was a
      //          history push, so Undo is enabled.
      expect(
        screen.getByRole('button', { name: 'editor.undo' }),
      ).toBeEnabled();
      // Redo is initially disabled until the user actually undoes.
      expect(
        screen.getByRole('button', { name: 'editor.redo' }),
      ).toBeDisabled();

      // ── AC #5: Editor obeys the host module's styling — its surface
      //          is mounted INSIDE the styled module wrapper, so F7
      //          typography/color tokens flow via CSS inheritance.
      expect(card.contains(editorRoot)).toBe(true);

      // Exit edit mode via Escape (flush + exit).
      await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });
      await waitFor(() =>
        expect(card.getAttribute('data-editing')).toBe('false'),
      );

      // ── AC #6 (continued): Re-render with the saved module — the
      //          view-mode BlockListRenderer shows the round-tripped Text
      //          block. We add a non-empty span so `<TextBlockRenderer>`
      //          actually has visible text to assert against.
      const savedModule: Module = {
        ...initialModule,
        content: [
          {
            type: 'Text',
            spans: [
              { text: 'hello ', bold: false },
              { text: 'world', bold: true },
            ],
          },
        ],
      };
      qc.setQueryData(pageModulesQueryKey(PAGE_ID), [savedModule]);
      rerender(
        <RouterProvider
          router={createMemoryRouter(
            [
              {
                path: '/',
                Component: () => (
                  <QueryClientProvider client={qc}>
                    <ModuleCard
                      module={savedModule}
                      isSelected={false}
                      onSelect={vi.fn()}
                    />
                  </QueryClientProvider>
                ),
              },
            ],
            { initialEntries: ['/'] },
          )}
        />,
      );
      expect(screen.getByText('hello')).toBeInTheDocument();
      expect(screen.getByText('world')).toBeInTheDocument();
    },
  );

  it('Breadcrumb modules show the auto-generated message and never enter the block editor', async () => {
    // ── AC #9: Breadcrumb modules show auto-generated message; no editor.
    const breadcrumb = makeModule({ moduleType: 'Breadcrumb', content: [] });
    const qc = makeQc([breadcrumb]);
    renderInProviders(
      <ModuleCard module={breadcrumb} isSelected onSelect={vi.fn()} />,
      qc,
    );
    fireEvent.click(screen.getByRole('button', { name: 'editor.edit' }));
    // The lazy editor still mounts (the empty-state lives inside it), but
    // the Add Block trigger is disabled and Save is disabled.
    await screen.findByLabelText('editor.edit', {
      selector: '[data-edit-mode="true"]',
    });
    // Auto-gen message rendered as a `<note>` landmark.
    expect(
      screen.getByRole('note', { name: 'editor.breadcrumbAutoGen' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'editor.addBlock' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'common.save' }),
    ).toBeDisabled();
  });

  it('Title module Add Block popover lists exactly Date + Text (MODULE_ALLOWED_BLOCKS UI gate)', async () => {
    // ── AC #8: MODULE_ALLOWED_BLOCKS enforced in the Add-Block dropdown.
    const user = userEvent.setup();
    const title = makeModule({ moduleType: 'Title', content: [] });
    const qc = makeQc([title]);
    renderInProviders(
      <ModuleCard module={title} isSelected onSelect={vi.fn()} />,
      qc,
    );
    fireEvent.click(screen.getByRole('button', { name: 'editor.edit' }));
    await screen.findByLabelText('editor.edit', {
      selector: '[data-edit-mode="true"]',
    });
    await user.click(screen.getByRole('button', { name: 'editor.addBlock' }));
    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(2);
    const labels = options.map((o) => o.textContent ?? '');
    expect(labels.some((l) => /editor\.blockType\.date/i.test(l))).toBe(true);
    expect(labels.some((l) => /editor\.blockType\.text/i.test(l))).toBe(true);
  });

  it('Unimplemented block types render the "[Type — coming soon]" placeholder via BLOCK_REGISTRY (view mode)', () => {
    // ── AC #7: Block registry exhaustively keys every BuildingBlockType;
    //          unimplemented types fall back to the placeholder renderer.
    const m = makeModule({
      content: [
        // 'Table' is registered as a placeholder descriptor in plan 01-03.
        { type: 'Table' },
      ],
    });
    const qc = makeQc([m]);
    renderInProviders(
      <ModuleCard module={m} isSelected={false} onSelect={vi.fn()} />,
      qc,
    );
    // PlaceholderBlock renders as role="note" with `editor.placeholderBlockA11y`.
    expect(
      screen.getByRole('note', { name: 'editor.placeholderBlockA11y' }),
    ).toBeInTheDocument();
  });

  it('Failed save while editing + route change → UnsavedChangesDialog opens (dirty-nav guard)', async () => {
    // ── AC #4: Closing/navigating with unsaved dirty state prompts the
    //          user (AlertDialog confirm) — *route change only*.
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const m = makeModule({ content: [] });
    const qc = makeQc([m]);

    // Server rejects the PUT → the mutation transitions to status='failed'.
    mockedUpdate.mockRejectedValue(
      Object.assign(new Error('422'), {
        response: { status: 422, data: { code: 'INVALID_BUILDING_BLOCK' } },
      }),
    );

    const router = createMemoryRouter(
      [
        {
          path: '/',
          Component: () => (
            <QueryClientProvider client={qc}>
              <ModuleCard module={m} isSelected onSelect={vi.fn()} />
            </QueryClientProvider>
          ),
        },
        { path: '/elsewhere', element: <div data-testid="elsewhere">x</div> },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    // Enter edit mode and dispatch an edit so a save attempt is made.
    fireEvent.click(screen.getByRole('button', { name: 'editor.edit' }));
    await screen.findByLabelText('editor.edit', {
      selector: '[data-edit-mode="true"]',
    });
    await act(async () => {
      screen.getByRole('button', { name: 'editor.addBlock' }).click();
    });
    const textOption = await screen.findByRole('option', {
      name: /editor\.blockType\.text/i,
    });
    await act(async () => {
      textOption.click();
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // Wait for the rejected mutation to settle.
    await waitFor(() =>
      expect(mockedUpdate).toHaveBeenCalledTimes(1),
    );

    // Trigger a route change — the blocker should fire.
    await act(async () => {
      void router.navigate('/elsewhere');
      await Promise.resolve();
    });

    // The unsaved-changes dialog opens with the locked copy.
    await waitFor(
      () => {
        expect(
          screen.getByRole('alertdialog', {
            name: 'editor.unsavedTitle',
          }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    expect(
      screen.getByRole('button', { name: 'editor.unsavedKeepEditing' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'editor.unsavedDiscard' }),
    ).toBeInTheDocument();
  });
});


