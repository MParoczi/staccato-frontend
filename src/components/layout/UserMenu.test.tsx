import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { MemoryRouter } from 'react-router';
import { UserMenu } from './UserMenu';
import type { UserDisplayProjection } from '@/lib/utils/user-display';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Radix AvatarImage uses `new window.Image()` and only renders the <img>
// once the image has loaded. jsdom never fires load events automatically,
// so stub the Image constructor to fire `onload` synchronously.
const OriginalImage = globalThis.Image;

beforeAll(() => {
  class MockImage {
    private listeners: Record<string, Array<() => void>> = {};
    referrerPolicy = '';
    crossOrigin: string | null = null;
    private _src = '';
    addEventListener(event: string, cb: () => void) {
      (this.listeners[event] ??= []).push(cb);
    }
    removeEventListener(event: string, cb: () => void) {
      this.listeners[event] = (this.listeners[event] ?? []).filter((x) => x !== cb);
    }
    get src() {
      return this._src;
    }
    set src(value: string) {
      this._src = value;
      queueMicrotask(() => {
        for (const cb of this.listeners['load'] ?? []) cb();
      });
    }
  }
  // @ts-expect-error — assigning a minimal stub for the Image global in tests
  globalThis.Image = MockImage;
});

afterAll(() => {
  globalThis.Image = OriginalImage;
});

function renderUserMenu(
  overrides: {
    projection?: UserDisplayProjection;
    avatarUrl?: string | null;
  } = {},
) {
  const projection: UserDisplayProjection = overrides.projection ?? {
    tier: 1,
    displayName: 'Ada Lovelace',
    avatarFallback: 'AL',
  };
  const avatarUrl = 'avatarUrl' in overrides ? overrides.avatarUrl! : 'https://example.com/a.png';
  return render(
    <MemoryRouter>
      <UserMenu projection={projection} avatarUrl={avatarUrl} onLogout={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('UserMenu avatar accessibility', () => {
  it('sets the AvatarImage alt to the display name when an avatar URL is provided', async () => {
    renderUserMenu();

    const img = await screen.findByRole('img', { name: 'Ada Lovelace' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Ada Lovelace');
    expect(img).toHaveAttribute('src', 'https://example.com/a.png');
  });

  it('falls back to the fallback-name translation when no real name is known', async () => {
    renderUserMenu({
      projection: {
        tier: 4,
        displayName: 'app.sidebar.userMenu.fallbackName',
        avatarFallback: 'icon',
      },
    });

    const img = await screen.findByRole('img', { name: 'app.sidebar.userMenu.fallbackName' });
    expect(img).toHaveAttribute('alt', 'app.sidebar.userMenu.fallbackName');
  });

  it('does not render an AvatarImage when avatarUrl is null', () => {
    renderUserMenu({ avatarUrl: null });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
