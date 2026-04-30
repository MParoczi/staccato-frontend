/**
 * ModuleCard editor-integration tests (plan 01-06 task 6.4).
 *
 * Covers the new edit-mode behaviors layered on top of the F8 ModuleCard
 * surface: edit-mode entry (click / double-click / EditButton), edit-mode
 * exit (click-outside / Escape), the React.lazy + Suspense boundary, and
 * the view-mode BlockListRenderer dispatch.
 *
 * The existing F8 tests live in `ModuleCard.test.tsx` and remain the
 * regression gate. Both files run on every `pnpm test ModuleCard` invocation.
 */
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
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
  updateModuleFull: vi.fn(() =>
    Promise.resolve({
      id: 'module-1',
      lessonPageId: 'page-1',
      moduleType: 'Theory',
      gridX: 2,
      gridY: 3,
      gridWidth: 10,
      gridHeight: 6,
      zIndex: 5,
      content: [],
    } satisfies Module),
  ),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'module-1',
    lessonPageId: 'page-1',
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

function renderInProviders(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function Root() {
    return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
  }
  const router = createMemoryRouter(
    [
      { path: '/', Component: Root },
      { path: '/other', element: <div data-testid="other">other</div> },
    ],
    { initialEntries: ['/'] },
  );
  return { ...render(<RouterProvider router={router} />), client };
}

describe('ModuleCard — edit-mode integration (plan 01-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows EditButton when selected and not editing', () => {
    const m = makeModule();
    renderInProviders(
      <ModuleCard module={m} isSelected onSelect={vi.fn()} />,
    );
    expect(
      screen.getByRole('button', { name: 'editor.edit' }),
    ).toBeInTheDocument();
  });

  it('does NOT show EditButton when not selected', () => {
    const m = makeModule();
    renderInProviders(
      <ModuleCard module={m} isSelected={false} onSelect={vi.fn()} />,
    );
    expect(
      screen.queryByRole('button', { name: 'editor.edit' }),
    ).toBeNull();
  });

  it('clicking the EditButton enters edit mode (data-editing="true")', async () => {
    const m = makeModule();
    renderInProviders(
      <ModuleCard module={m} isSelected onSelect={vi.fn()} />,
    );
    const editBtn = screen.getByRole('button', { name: 'editor.edit' });
    fireEvent.click(editBtn);
    const card = screen.getByTestId(`module-card-${m.id}`);
    await waitFor(() =>
      expect(card.getAttribute('data-editing')).toBe('true'),
    );
    // Once editing, the EditButton hides.
    expect(
      screen.queryByRole('button', { name: 'editor.edit' }),
    ).toBeNull();
  });

  it('single-click on already-selected module enters edit mode (gesture #1)', async () => {
    const m = makeModule();
    renderInProviders(
      <ModuleCard module={m} isSelected onSelect={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId(`module-card-${m.id}`));
    const card = screen.getByTestId(`module-card-${m.id}`);
    await waitFor(() =>
      expect(card.getAttribute('data-editing')).toBe('true'),
    );
  });

  it('double-click on unselected module selects AND enters edit mode (gesture #2)', async () => {
    const m = makeModule();
    const onSelect = vi.fn();
    renderInProviders(
      <ModuleCard module={m} isSelected={false} onSelect={onSelect} />,
    );
    fireEvent.doubleClick(screen.getByTestId(`module-card-${m.id}`));
    expect(onSelect).toHaveBeenCalledWith(m.id);
    const card = screen.getByTestId(`module-card-${m.id}`);
    await waitFor(() =>
      expect(card.getAttribute('data-editing')).toBe('true'),
    );
  });

  it('mounts the lazy ModuleEditor inside the Suspense boundary after entering edit mode', async () => {
    const m = makeModule();
    renderInProviders(
      <ModuleCard module={m} isSelected onSelect={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'editor.edit' }));
    // ModuleEditor's root carries data-edit-mode="true"; wait for lazy resolution.
    const editor = await screen.findByLabelText('editor.edit', {
      selector: '[data-edit-mode="true"]',
    });
    expect(editor).toBeInTheDocument();
  });

  it('Escape key while editing exits edit mode', async () => {
    const m = makeModule();
    renderInProviders(
      <ModuleCard module={m} isSelected onSelect={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'editor.edit' }));
    await screen.findByLabelText('editor.edit', {
      selector: '[data-edit-mode="true"]',
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    const card = screen.getByTestId(`module-card-${m.id}`);
    await waitFor(() =>
      expect(card.getAttribute('data-editing')).toBe('false'),
    );
  });

  it('mousedown outside the wrapper exits edit mode (click-outside flush)', async () => {
    const m = makeModule();
    const { container } = renderInProviders(
      <>
        <ModuleCard module={m} isSelected onSelect={vi.fn()} />
        <div data-testid="outside">outside</div>
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'editor.edit' }));
    await screen.findByLabelText('editor.edit', {
      selector: '[data-edit-mode="true"]',
    });
    // Dispatch mousedown at document.body level (outside the wrapper).
    fireEvent.mouseDown(screen.getByTestId('outside'));
    const card = screen.getByTestId(`module-card-${m.id}`);
    await waitFor(() =>
      expect(card.getAttribute('data-editing')).toBe('false'),
    );
    expect(container).toBeTruthy();
  });

  it('view-mode renders BlockListRenderer for non-empty Text content', () => {
    const m = makeModule({
      content: [
        {
          type: 'Text',
          spans: [{ text: 'hello world', bold: false }],
        },
      ],
    });
    renderInProviders(
      <ModuleCard module={m} isSelected={false} onSelect={vi.fn()} />,
    );
    // Body shows rendered text from BLOCK_REGISTRY.Text.Renderer.
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('clicking inside the editor surface does NOT re-fire onSelect (data-prevent-edit-entry guard)', async () => {
    const m = makeModule();
    const onSelect = vi.fn();
    renderInProviders(
      <ModuleCard module={m} isSelected onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'editor.edit' }));
    const editorRoot = await screen.findByLabelText('editor.edit', {
      selector: '[data-edit-mode="true"]',
    });
    onSelect.mockClear();
    fireEvent.click(editorRoot);
    // The interactive-target guard in useEditModeEntry should prevent any
    // further onSelect/onEnterEdit firing once focus is inside the editor.
    expect(onSelect).not.toHaveBeenCalled();
  });
});

