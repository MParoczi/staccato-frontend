import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
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
beforeEach(() => {
  // Default handlers for preset endpoints so the drawer can open without
  // having to explicitly mock them in every test. Individual tests that
  // need different preset responses should call `server.use(...)` AFTER
  // `renderDrawer` OR override these handlers explicitly.
  server.use(
    http.get('http://localhost:5000/presets', () =>
      HttpResponse.json([], { status: 200 }),
    ),
    http.get('http://localhost:5000/users/me/presets', () =>
      HttpResponse.json([], { status: 200 }),
    ),
  );
});
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

  it('does not throw when closing the drawer while styles are still loading', async () => {
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

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });

    // Form hasn't mounted yet; skeleton is visible.
    expect(
      await screen.findByLabelText('styling.drawer.loading'),
    ).toBeInTheDocument();

    // Close the drawer (via Escape -> Radix fires onOpenChange(false)) while
    // the styles query is still pending. This must not throw or log errors
    // even though no close-reset handler has been registered yet.
    expect(() => {
      fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });
    }).not.toThrow();

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();

    // Resolve the pending request to avoid leaking into other tests.
    resolveReq(makeStyles());
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

  it('applies a preset immediately when the form is not dirty and refreshes styles', async () => {
    const applied = makeStyles().map((s) =>
      s.moduleType === 'Theory' ? { ...s, backgroundColor: '#ABCDEF' } : s,
    );
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.get('http://localhost:5000/presets', () =>
        HttpResponse.json(
          [
            {
              id: 'sys-1',
              name: 'Classic',
              displayOrder: 1,
              isDefault: false,
              styles: makeStyles(),
            },
          ],
          { status: 200 },
        ),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json([], { status: 200 }),
      ),
      http.post(
        `http://localhost:5000/notebooks/${notebookId}/styles/apply-preset/sys-1`,
        () => HttpResponse.json(applied, { status: 200 }),
      ),
    );

    renderDrawer();

    const applyButton = await screen.findByRole('button', {
      name: 'styling.presets.apply',
    });
    expect(applyButton).toBeEnabled();

    await act(async () => {
      fireEvent.click(applyButton);
    });

    // No confirmation dialog on clean form
    expect(
      screen.queryByRole('alertdialog', {
        name: 'styling.presets.confirmApplyTitle',
      }),
    ).not.toBeInTheDocument();

    // Preview should eventually reflect the applied preset's active-tab color.
    await waitFor(() => {
      const preview = document.querySelector<HTMLElement>(
        '[data-slot="style-preview"]',
      );
      expect(preview).not.toBeNull();
    });
  });

  it('prompts for confirmation when applying a preset while the form is dirty and resets after confirm', async () => {
    const applied = makeStyles().map((s) =>
      s.moduleType === 'Theory' ? { ...s, backgroundColor: '#ABCDEF' } : s,
    );
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.get('http://localhost:5000/presets', () =>
        HttpResponse.json(
          [
            {
              id: 'sys-1',
              name: 'Classic',
              displayOrder: 1,
              isDefault: false,
              styles: makeStyles(),
            },
          ],
          { status: 200 },
        ),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json([], { status: 200 }),
      ),
      http.post(
        `http://localhost:5000/notebooks/${notebookId}/styles/apply-preset/sys-1`,
        () => HttpResponse.json(applied, { status: 200 }),
      ),
    );

    renderDrawer();

    // Dirty the form first by changing a color.
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

    // Clicking apply must open the confirmation dialog first.
    const applyButton = await screen.findByRole('button', {
      name: 'styling.presets.apply',
    });
    fireEvent.click(applyButton);

    const confirmAction = await screen.findByRole('button', {
      name: 'styling.presets.apply',
      hidden: false,
    });
    // Radix AlertDialog renders its action as role=button with the same name
    // as our apply buttons, so pick the one inside the dialog.
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('styling.presets.confirmApplyMessage');

    // Confirm
    const dialogAction = dialog.querySelector<HTMLButtonElement>(
      '[data-slot="preset-apply-confirm-action"]',
    );
    expect(dialogAction).not.toBeNull();
    await act(async () => {
      dialogAction?.click();
    });

    // After confirm, the dirty indicator is cleared because the form is
    // reset to the applied preset values.
    await waitFor(() =>
      expect(
        screen.queryByText('styling.drawer.unsaved'),
      ).not.toBeInTheDocument(),
    );
    expect(confirmAction).toBeTruthy();
  });

  it('cancels preset apply and keeps dirty form when confirmation is dismissed', async () => {
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.get('http://localhost:5000/presets', () =>
        HttpResponse.json(
          [
            {
              id: 'sys-1',
              name: 'Classic',
              displayOrder: 1,
              isDefault: false,
              styles: makeStyles(),
            },
          ],
          { status: 200 },
        ),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json([], { status: 200 }),
      ),
    );

    renderDrawer();
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

    const applyButton = await screen.findByRole('button', {
      name: 'styling.presets.apply',
    });
    fireEvent.click(applyButton);

    const dialog = await screen.findByRole('alertdialog');
    const cancel = dialog.querySelector<HTMLButtonElement>(
      '[data-slot="preset-apply-cancel"]',
    );
    expect(cancel).not.toBeNull();
    await act(async () => {
      cancel?.click();
    });

    // Dialog closes, dirty indicator still visible.
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('styling.drawer.unsaved')).toBeInTheDocument();
  });

  it('saves the current styles as a new user preset under a unique name', async () => {
    const existingPresets = [
      {
        id: 'user-existing',
        name: 'Already saved',
        styles: MODULE_STYLE_TAB_ORDER.map((m) => ({
          moduleType: m,
          stylesJson: JSON.stringify({
            backgroundColor: '#FFFFFF',
            borderColor: '#CCCCCC',
            borderStyle: 'Solid',
            borderWidth: 1,
            borderRadius: 4,
            headerBgColor: '#F0E6D3',
            headerTextColor: '#333333',
            bodyTextColor: '#333333',
            fontFamily: 'Default',
          }),
        })),
      },
    ];
    const createdPreset = {
      id: 'user-new',
      name: 'My Custom Theme',
      styles: existingPresets[0].styles,
    };
    let capturedCreateBody: { name: string; styles: unknown[] } | null = null;

    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json(existingPresets, { status: 200 }),
      ),
      http.post(
        'http://localhost:5000/users/me/presets',
        async ({ request }) => {
          capturedCreateBody = (await request.json()) as {
            name: string;
            styles: unknown[];
          };
          return HttpResponse.json(createdPreset, { status: 201 });
        },
      ),
    );

    renderDrawer();

    const saveAsButton = await screen.findByRole('button', {
      name: 'styling.presets.saveAs',
    });
    await waitFor(() => expect(saveAsButton).toBeEnabled());

    await act(async () => {
      fireEvent.click(saveAsButton);
    });

    const nameInput = await screen.findByLabelText(
      'styling.presets.nameLabel',
    );
    fireEvent.change(nameInput, { target: { value: 'My Custom Theme' } });

    const submit = screen.getByRole('button', { name: 'common.save' });
    await act(async () => {
      fireEvent.click(submit);
    });

    // The POST body must contain the serialized 12-entry styles payload and
    // the trimmed name. Identical style payloads are allowed as long as the
    // name is unique, which this flow exercises.
    await waitFor(() => {
      expect(capturedCreateBody).not.toBeNull();
    });
    expect(capturedCreateBody?.name).toBe('My Custom Theme');
    expect(capturedCreateBody?.styles).toHaveLength(
      MODULE_STYLE_TAB_ORDER.length,
    );

    // After success the dialog closes.
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="save-preset-dialog"]'),
      ).toBeNull(),
    );
  });

  it('surfaces duplicate-name server errors inline and keeps the save-as dialog open', async () => {
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.post('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json({ message: 'duplicate' }, { status: 409 }),
      ),
    );

    renderDrawer();

    const saveAsButton = await screen.findByRole('button', {
      name: 'styling.presets.saveAs',
    });
    await waitFor(() => expect(saveAsButton).toBeEnabled());
    await act(async () => {
      fireEvent.click(saveAsButton);
    });

    const nameInput = await screen.findByLabelText(
      'styling.presets.nameLabel',
    );
    fireEvent.change(nameInput, { target: { value: 'Existing name' } });

    const submit = screen.getByRole('button', { name: 'common.save' });
    await act(async () => {
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(
        document.querySelector('[data-slot="save-preset-duplicate-error"]'),
      ).not.toBeNull();
    });
    // Dialog must remain open so the user can correct the name.
    expect(
      document.querySelector('[data-slot="save-preset-dialog"]'),
    ).not.toBeNull();
  });

  it('disables the Save-as CTA and shows the limit-reached message when 20 presets exist', async () => {
    const atLimit = Array.from({ length: 20 }, (_, i) => ({
      id: `u-${i}`,
      name: `Preset ${i}`,
      styles: [] as Array<{ moduleType: string; stylesJson: string }>,
    }));
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json(atLimit, { status: 200 }),
      ),
    );

    renderDrawer();

    const saveAsButton = await screen.findByRole('button', {
      name: 'styling.presets.saveAs',
    });
    await waitFor(() => expect(saveAsButton).toBeDisabled());
    expect(
      document.querySelector('[data-slot="preset-limit-reached"]'),
    ).not.toBeNull();
  });

  it('renames a user preset inline, committing on Enter', async () => {
    const existing = [
      {
        id: 'user-1',
        name: 'Old name',
        styles: MODULE_STYLE_TAB_ORDER.map((m) => ({
          moduleType: m,
          stylesJson: JSON.stringify({
            backgroundColor: '#FFFFFF',
            borderColor: '#CCCCCC',
            borderStyle: 'Solid',
            borderWidth: 1,
            borderRadius: 4,
            headerBgColor: '#F0E6D3',
            headerTextColor: '#333333',
            bodyTextColor: '#333333',
            fontFamily: 'Default',
          }),
        })),
      },
    ];
    let renameBody: { name: string } | null = null;
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json(existing, { status: 200 }),
      ),
      http.put(
        'http://localhost:5000/users/me/presets/user-1',
        async ({ request }) => {
          renameBody = (await request.json()) as { name: string };
          return HttpResponse.json(
            { id: 'user-1', name: renameBody.name, styles: existing[0].styles },
            { status: 200 },
          );
        },
      ),
    );

    renderDrawer();

    const pencil = await screen.findByRole('button', {
      name: 'styling.presets.rename',
    });
    fireEvent.click(pencil);

    const input = document.querySelector<HTMLInputElement>(
      '[data-slot="preset-name-input"]',
    );
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: 'Fresh name' } });
    await act(async () => {
      fireEvent.keyDown(input!, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(renameBody).not.toBeNull();
    });
    expect(renameBody?.name).toBe('Fresh name');
  });

  it('cancels an inline rename on Escape without sending a request', async () => {
    const existing = [
      {
        id: 'user-1',
        name: 'Keep me',
        styles: MODULE_STYLE_TAB_ORDER.map((m) => ({
          moduleType: m,
          stylesJson: JSON.stringify({
            backgroundColor: '#FFFFFF',
            borderColor: '#CCCCCC',
            borderStyle: 'Solid',
            borderWidth: 1,
            borderRadius: 4,
            headerBgColor: '#F0E6D3',
            headerTextColor: '#333333',
            bodyTextColor: '#333333',
            fontFamily: 'Default',
          }),
        })),
      },
    ];
    let putCalls = 0;
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json(existing, { status: 200 }),
      ),
      http.put('http://localhost:5000/users/me/presets/user-1', () => {
        putCalls += 1;
        return HttpResponse.json(existing[0], { status: 200 });
      }),
    );

    renderDrawer();

    const pencil = await screen.findByRole('button', {
      name: 'styling.presets.rename',
    });
    fireEvent.click(pencil);

    const input = document.querySelector<HTMLInputElement>(
      '[data-slot="preset-name-input"]',
    );
    fireEvent.change(input!, { target: { value: 'Abandoned' } });
    fireEvent.keyDown(input!, { key: 'Escape' });

    await waitFor(() => {
      expect(
        document.querySelector('[data-slot="preset-name-input"]'),
      ).toBeNull();
    });
    expect(putCalls).toBe(0);
  });

  it('surfaces duplicate-name server errors inline on the preset card', async () => {
    const existing = [
      {
        id: 'user-1',
        name: 'Original',
        styles: MODULE_STYLE_TAB_ORDER.map((m) => ({
          moduleType: m,
          stylesJson: JSON.stringify({
            backgroundColor: '#FFFFFF',
            borderColor: '#CCCCCC',
            borderStyle: 'Solid',
            borderWidth: 1,
            borderRadius: 4,
            headerBgColor: '#F0E6D3',
            headerTextColor: '#333333',
            bodyTextColor: '#333333',
            fontFamily: 'Default',
          }),
        })),
      },
    ];
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json(existing, { status: 200 }),
      ),
      http.put('http://localhost:5000/users/me/presets/user-1', () =>
        HttpResponse.json({ message: 'duplicate' }, { status: 409 }),
      ),
    );

    renderDrawer();

    const pencil = await screen.findByRole('button', {
      name: 'styling.presets.rename',
    });
    fireEvent.click(pencil);
    const input = document.querySelector<HTMLInputElement>(
      '[data-slot="preset-name-input"]',
    );
    fireEvent.change(input!, { target: { value: 'Taken' } });
    await act(async () => {
      fireEvent.keyDown(input!, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(
        document.querySelector('[data-slot="preset-rename-duplicate-error"]'),
      ).not.toBeNull();
    });
    // The rename input remains open so the user can correct the value.
    expect(
      document.querySelector('[data-slot="preset-name-input"]'),
    ).not.toBeNull();
  });

  it('deletes a user preset only after the confirmation dialog is accepted', async () => {
    const existing = [
      {
        id: 'user-1',
        name: 'Deletable',
        styles: MODULE_STYLE_TAB_ORDER.map((m) => ({
          moduleType: m,
          stylesJson: JSON.stringify({
            backgroundColor: '#FFFFFF',
            borderColor: '#CCCCCC',
            borderStyle: 'Solid',
            borderWidth: 1,
            borderRadius: 4,
            headerBgColor: '#F0E6D3',
            headerTextColor: '#333333',
            bodyTextColor: '#333333',
            fontFamily: 'Default',
          }),
        })),
      },
    ];
    let deleteCalls = 0;
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json(existing, { status: 200 }),
      ),
      http.delete('http://localhost:5000/users/me/presets/user-1', () => {
        deleteCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderDrawer();

    const trash = await screen.findByRole('button', {
      name: 'styling.presets.delete',
    });
    fireEvent.click(trash);

    // Confirmation dialog must appear before the request is sent.
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('styling.presets.confirmDeleteTitle');
    expect(deleteCalls).toBe(0);

    const confirmAction = dialog.querySelector<HTMLButtonElement>(
      '[data-slot="preset-delete-confirm-action"]',
    );
    expect(confirmAction).not.toBeNull();
    await act(async () => {
      confirmAction?.click();
    });

    await waitFor(() => expect(deleteCalls).toBe(1));
  });

  it('does not send a delete request when the confirmation dialog is cancelled', async () => {
    const existing = [
      {
        id: 'user-1',
        name: 'Keep me',
        styles: MODULE_STYLE_TAB_ORDER.map((m) => ({
          moduleType: m,
          stylesJson: JSON.stringify({
            backgroundColor: '#FFFFFF',
            borderColor: '#CCCCCC',
            borderStyle: 'Solid',
            borderWidth: 1,
            borderRadius: 4,
            headerBgColor: '#F0E6D3',
            headerTextColor: '#333333',
            bodyTextColor: '#333333',
            fontFamily: 'Default',
          }),
        })),
      },
    ];
    let deleteCalls = 0;
    server.use(
      http.get(
        `http://localhost:5000/notebooks/${notebookId}/styles`,
        () => HttpResponse.json(makeStyles(), { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json(existing, { status: 200 }),
      ),
      http.delete('http://localhost:5000/users/me/presets/user-1', () => {
        deleteCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderDrawer();

    const trash = await screen.findByRole('button', {
      name: 'styling.presets.delete',
    });
    fireEvent.click(trash);

    const dialog = await screen.findByRole('alertdialog');
    const cancel = dialog.querySelector<HTMLButtonElement>(
      '[data-slot="preset-delete-cancel"]',
    );
    expect(cancel).not.toBeNull();
    await act(async () => {
      cancel?.click();
    });

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(deleteCalls).toBe(0);
  });
});
