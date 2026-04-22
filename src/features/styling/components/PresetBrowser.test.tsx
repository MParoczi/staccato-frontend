import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
import { PresetBrowser } from './PresetBrowser';
import type {
  NotebookModuleStyle,
  StyleEntry,
  SystemStylePreset,
  UserSavedPreset,
} from '@/lib/types';
import { MODULE_STYLE_TAB_ORDER } from '../utils/style-defaults';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

function makeStyle(
  moduleType: (typeof MODULE_STYLE_TAB_ORDER)[number],
): NotebookModuleStyle {
  return {
    id: `${moduleType}-id`,
    notebookId: 'nb',
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
  };
}

function makeSystemPreset(
  id: string,
  name: string,
  displayOrder: number,
): SystemStylePreset {
  return {
    id,
    name,
    displayOrder,
    isDefault: false,
    styles: MODULE_STYLE_TAB_ORDER.map((m) => makeStyle(m)),
  };
}

function makeUserPreset(id: string, name: string): UserSavedPreset {
  const entries: StyleEntry[] = MODULE_STYLE_TAB_ORDER.map((m) => ({
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
  }));
  return { id, name, styles: entries };
}

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

interface RenderArgs {
  onApplyPreset?: (id: string) => void;
  applyingPresetId?: string | null;
  isApplying?: boolean;
}

function renderBrowser(args: RenderArgs = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onApplyPreset = args.onApplyPreset ?? vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <PresetBrowser
        onApplyPreset={onApplyPreset}
        applyingPresetId={args.applyingPresetId ?? null}
        isApplying={args.isApplying ?? false}
      />
    </QueryClientProvider>,
  );
  return { ...utils, onApplyPreset, queryClient };
}

describe('PresetBrowser', () => {
  it('shows loading skeletons for both sections while presets are loading', async () => {
    let resolveSystem: (presets: SystemStylePreset[]) => void = () => {};
    let resolveUser: (presets: UserSavedPreset[]) => void = () => {};
    const systemPending = new Promise<SystemStylePreset[]>((res) => {
      resolveSystem = res;
    });
    const userPending = new Promise<UserSavedPreset[]>((res) => {
      resolveUser = res;
    });
    server.use(
      http.get('http://localhost:5000/presets', async () => {
        const s = await systemPending;
        return HttpResponse.json(s, { status: 200 });
      }),
      http.get('http://localhost:5000/users/me/presets', async () => {
        const u = await userPending;
        return HttpResponse.json(u, { status: 200 });
      }),
    );

    renderBrowser();

    await waitFor(() => {
      expect(
        document.querySelector('[data-slot="preset-section-system-loading"]'),
      ).not.toBeNull();
      expect(
        document.querySelector('[data-slot="preset-section-user-loading"]'),
      ).not.toBeNull();
    });

    resolveSystem([]);
    resolveUser([]);
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="preset-section-system-loading"]'),
      ).toBeNull(),
    );
  });

  it('renders empty-state copy when each section returns no presets', async () => {
    server.use(
      http.get('http://localhost:5000/presets', () =>
        HttpResponse.json([], { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json([], { status: 200 }),
      ),
    );

    renderBrowser();

    await waitFor(() => {
      const emptyElems = document.querySelectorAll(
        '[data-slot$="-empty"]',
      );
      expect(emptyElems.length).toBe(2);
    });
    const emptyMessages = Array.from(
      document.querySelectorAll('[data-slot$="-empty"]'),
    ).map((el) => el.textContent);
    expect(emptyMessages).toContain('styling.presets.empty');
  });

  it('renders system and user presets independently and preserves user order', async () => {
    const systemPresets = [
      makeSystemPreset('sys-1', 'Classic', 1),
      makeSystemPreset('sys-2', 'Ocean', 2),
    ];
    const userPresets = [
      makeUserPreset('user-1', 'Newest'),
      makeUserPreset('user-2', 'Middle'),
      makeUserPreset('user-3', 'Oldest'),
    ];
    server.use(
      http.get('http://localhost:5000/presets', () =>
        HttpResponse.json(systemPresets, { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json(userPresets, { status: 200 }),
      ),
    );

    renderBrowser();

    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="preset-section-system-list"]'),
      ).not.toBeNull(),
    );

    const systemCards = document.querySelectorAll(
      '[data-slot="preset-section-system-list"] [data-slot="preset-card"]',
    );
    expect(systemCards).toHaveLength(2);

    const userCards = Array.from(
      document.querySelectorAll(
        '[data-slot="preset-section-user-list"] [data-slot="preset-card"]',
      ),
    );
    expect(userCards.map((el) => el.getAttribute('data-preset-id'))).toEqual([
      'user-1',
      'user-2',
      'user-3',
    ]);
  });

  it('calls onApplyPreset with the selected preset id', async () => {
    const systemPresets = [makeSystemPreset('sys-1', 'Classic', 1)];
    server.use(
      http.get('http://localhost:5000/presets', () =>
        HttpResponse.json(systemPresets, { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json([], { status: 200 }),
      ),
    );

    const onApplyPreset = vi.fn();
    renderBrowser({ onApplyPreset });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'styling.presets.apply' }))
        .toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'styling.presets.apply' }),
    );
    expect(onApplyPreset).toHaveBeenCalledWith('sys-1');
  });

  it('disables apply on non-pending cards while another preset is applying', async () => {
    const systemPresets = [
      makeSystemPreset('sys-1', 'Classic', 1),
      makeSystemPreset('sys-2', 'Ocean', 2),
    ];
    server.use(
      http.get('http://localhost:5000/presets', () =>
        HttpResponse.json(systemPresets, { status: 200 }),
      ),
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json([], { status: 200 }),
      ),
    );

    renderBrowser({
      applyingPresetId: 'sys-1',
      isApplying: true,
    });

    await waitFor(() =>
      expect(
        document.querySelectorAll(
          '[data-slot="preset-section-system-list"] [data-slot="preset-card"]',
        ),
      ).toHaveLength(2),
    );

    // The applying card shows the applying label
    const applyingButton = screen.getByRole('button', {
      name: 'styling.presets.applying',
    });
    expect(applyingButton).toBeDisabled();

    // Other cards keep the normal label but are disabled
    const idleButtons = screen.getAllByRole('button', {
      name: 'styling.presets.apply',
    });
    expect(idleButtons).toHaveLength(1);
    expect(idleButtons[0]).toBeDisabled();
  });
});
