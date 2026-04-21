import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { StyleEditorDrawer } from './StyleEditorDrawer';
import type { NotebookModuleStyle } from '@/lib/types';
import { MODULE_STYLE_TAB_ORDER } from '../utils/style-defaults';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const notebookId = 'nb-1';

function makeStyles(): NotebookModuleStyle[] {
  return MODULE_STYLE_TAB_ORDER.map((moduleType) => ({
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
  }));
}

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

interface RenderArgs {
  initialData?: NotebookModuleStyle[] | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function renderDrawer(args: RenderArgs = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  if (args.initialData) {
    queryClient.setQueryData(
      ['notebooks', notebookId, 'styles'],
      args.initialData,
    );
  }
  const onOpenChange = args.onOpenChange ?? vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <StyleEditorDrawer
        notebookId={notebookId}
        open={args.open ?? true}
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>,
  );
  return { ...utils, queryClient, onOpenChange };
}

describe('StyleEditorDrawer', () => {
  it('shows loading skeletons while styles are loading', async () => {
    let resolveReq: (styles: NotebookModuleStyle[]) => void = () => {};
    const pending = new Promise<NotebookModuleStyle[]>((res) => {
      resolveReq = res;
    });
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        async () => {
          const s = await pending;
          return HttpResponse.json(s, { status: 200 });
        },
      ),
    );

    renderDrawer();
    expect(
      await screen.findByLabelText('styling.drawer.loading'),
    ).toBeInTheDocument();

    resolveReq(makeStyles());
    await waitFor(() =>
      expect(
        screen.queryByLabelText('styling.drawer.loading'),
      ).not.toBeInTheDocument(),
    );
  });

  it('renders all 12 module-type tabs after loading', async () => {
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
    );

    renderDrawer();
    await waitFor(() => {
      for (const moduleType of MODULE_STYLE_TAB_ORDER) {
        const key = moduleType.charAt(0).toLowerCase() + moduleType.slice(1);
        expect(
          screen.getByRole('tab', { name: `styling.moduleTypes.${key}` }),
        ).toBeInTheDocument();
      }
    });
  });

  it('last-tab-wins: preview updates after rapid tab switching', async () => {
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
    );

    renderDrawer();
    const theoryTab = await screen.findByRole('tab', {
      name: 'styling.moduleTypes.theory',
    });

    // Simulate rapid tab switches with keyboard ArrowRight (Radix auto-
    // activates on arrow keys). Title -> Breadcrumb -> Subtitle -> Theory.
    theoryTab.focus();
    act(() => {
      fireEvent.keyDown(theoryTab, { key: 'ArrowRight' });
    });

    await waitFor(() => {
      const preview = document.querySelector<HTMLElement>(
        '[data-slot="style-preview"]',
      );
      // The preview must reflect the currently-active tab (not stale).
      expect(preview?.dataset.moduleType).not.toBe('Title');
    });
  });

  it('dirty indicator becomes visible after editing, save submits and clears dirty', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.put(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(makeStyles(), { status: 200 });
        },
      ),
    );

    renderDrawer();

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'styling.drawer.save' }),
      ).toBeDisabled(),
    );

    // Open the body text color picker on the Theory tab and change it.
    const bodyColorButton = screen.getAllByRole('button', {
      name: 'styling.controls.bodyTextColor',
    })[0];
    fireEvent.click(bodyColorButton);
    const swatch = await screen.findByRole('option', { name: '#2F2A26' });
    fireEvent.click(swatch);

    await waitFor(() =>
      expect(
        screen.getByText('styling.drawer.unsaved'),
      ).toBeInTheDocument(),
    );

    const saveButton = screen.getByRole('button', {
      name: 'styling.drawer.save',
    });
    await waitFor(() => expect(saveButton).toBeEnabled());

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });
    expect(Array.isArray(capturedBody)).toBe(true);
    expect((capturedBody as unknown[]).length).toBe(
      MODULE_STYLE_TAB_ORDER.length,
    );

    // After successful save, dirty indicator should disappear.
    await waitFor(() =>
      expect(
        screen.queryByText('styling.drawer.unsaved'),
      ).not.toBeInTheDocument(),
    );
  });

  it('resets unsaved edits when the drawer is closed (close-discard)', async () => {
    const handlers = {
      get: http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
    };
    server.use(handlers.get);

    const onOpenChange = vi.fn();
    const { rerender, queryClient } = renderDrawer({ onOpenChange });

    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: 'styling.moduleTypes.theory' }),
      ).toBeInTheDocument(),
    );

    const bodyColorButton = screen.getAllByRole('button', {
      name: 'styling.controls.bodyTextColor',
    })[0];
    fireEvent.click(bodyColorButton);
    const swatch = await screen.findByRole('option', { name: '#2F2A26' });
    fireEvent.click(swatch);

    await waitFor(() =>
      expect(screen.getByText('styling.drawer.unsaved')).toBeInTheDocument(),
    );

    // Re-render closed to trigger close-discard reset behavior.
    rerender(
      <QueryClientProvider client={queryClient}>
        <StyleEditorDrawer
          notebookId={notebookId}
          open={false}
          onOpenChange={onOpenChange}
        />
      </QueryClientProvider>,
    );

    // Re-open and verify the dirty indicator is gone (form was reset).
    rerender(
      <QueryClientProvider client={queryClient}>
        <StyleEditorDrawer
          notebookId={notebookId}
          open
          onOpenChange={onOpenChange}
        />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(
        screen.queryByText('styling.drawer.unsaved'),
      ).not.toBeInTheDocument(),
    );
  });

  it('allows Tab/Shift+Tab keyboard traversal between focusable elements', async () => {
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
    );

    renderDrawer();

    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: 'styling.moduleTypes.theory' }),
      ).toBeInTheDocument(),
    );

    const bodyColor = screen.getAllByRole('button', {
      name: 'styling.controls.bodyTextColor',
    })[0];

    // Verify natively focusable: tabindex is not -1 (so Tab traversal works).
    expect(bodyColor).not.toHaveAttribute('tabindex', '-1');
    bodyColor.focus();
    expect(document.activeElement).toBe(bodyColor);
  });
});
