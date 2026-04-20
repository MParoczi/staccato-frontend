import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { AppSidebar } from './AppSidebar';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/lib/types/auth';

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted ensures these are available before vi.mock factories
// ---------------------------------------------------------------------------

const { mockNavigate, mockToastError, mockLogout, mockUseCurrentUser } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockToastError: vi.fn(),
  mockLogout: vi.fn(),
  mockUseCurrentUser: vi.fn(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: mockToastError },
}));

vi.mock('@/api/auth', () => ({
  logout: (...args: unknown[]) => mockLogout(...args),
}));

vi.mock('@/features/profile/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u-1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    language: 'en',
    defaultPageSize: null,
    defaultInstrumentId: null,
    avatarUrl: null,
    scheduledDeletionAt: null,
    ...overrides,
  };
}

function mockCurrentUser(opts: {
  user?: User | undefined;
  isPending?: boolean;
  isFetching?: boolean;
  isError?: boolean;
} = {}) {
  // Use 'in' check so explicitly passing user: undefined does NOT fall back
  const user = 'user' in opts ? opts.user : makeUser();
  const isPending = opts.isPending ?? false;
  const isFetching = opts.isFetching ?? false;
  const isError = opts.isError ?? false;
  mockUseCurrentUser.mockReturnValue({
    data: user,
    isPending,
    isFetching,
    isError,
  });
}

function renderSidebar(initialPath = '/app/notebooks') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppSidebar />
    </MemoryRouter>,
  );
}

async function openUserMenu() {
  const trigger = screen.getByRole('button', {
    name: 'app.sidebar.userMenu.openLabel',
  });
  // Radix DropdownMenu listens for pointer events
  await act(async () => {
    fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
    fireEvent.pointerUp(trigger, { pointerType: 'mouse' });
    fireEvent.click(trigger);
  });
  // Wait for the menu to open — look for the "Log out" menu item
  await waitFor(() => {
    expect(screen.getByRole('menuitem', { name: /app\.sidebar\.userMenu\.logout/ })).toBeInTheDocument();
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ accessToken: null, expiresAt: null, isLoggingOut: false });
  mockCurrentUser();
  mockLogout.mockResolvedValue(undefined);
});

// ===========================================================================
// (a) Active-state highlighting on each SC-002 route
// ===========================================================================

describe('AppSidebar', () => {
  describe('(a) active-state highlighting', () => {
    const ACTIVE_CLASS = 'bg-sidebar-primary';

    function getNavLinkByLabel(label: string): HTMLElement {
      return screen.getByRole('link', { name: new RegExp(label) });
    }

    it('/app/notebooks → Notebooks is active', () => {
      renderSidebar('/app/notebooks');
      const link = getNavLinkByLabel('app.sidebar.nav.notebooks');
      expect(link.className).toContain(ACTIVE_CLASS);
    });

    it('/app/notebooks/abc → Notebooks is active', () => {
      renderSidebar('/app/notebooks/abc');
      const link = getNavLinkByLabel('app.sidebar.nav.notebooks');
      expect(link.className).toContain(ACTIVE_CLASS);
    });

    it('/app/notebooks/abc/lessons/def/pages/ghi → Notebooks is active', () => {
      renderSidebar('/app/notebooks/abc/lessons/def/pages/ghi');
      const link = getNavLinkByLabel('app.sidebar.nav.notebooks');
      expect(link.className).toContain(ACTIVE_CLASS);
    });

    it('/app/chords → Chord Library is active', () => {
      renderSidebar('/app/chords');
      const link = getNavLinkByLabel('app.sidebar.nav.chords');
      expect(link.className).toContain(ACTIVE_CLASS);
    });

    it('/app/exports → Exports is active', () => {
      renderSidebar('/app/exports');
      const link = getNavLinkByLabel('app.sidebar.nav.exports');
      expect(link.className).toContain(ACTIVE_CLASS);
    });

    it('/app/profile → no nav entry is active', () => {
      renderSidebar('/app/profile');
      const links = screen.getAllByRole('link').filter((el) =>
        el.className.includes(ACTIVE_CLASS),
      );
      expect(links).toHaveLength(0);
    });

    it('/app/unknown → no nav entry is active', () => {
      renderSidebar('/app/unknown');
      const links = screen.getAllByRole('link').filter((el) =>
        el.className.includes(ACTIVE_CLASS),
      );
      expect(links).toHaveLength(0);
    });
  });

  // =========================================================================
  // (b) All four cascade tiers
  // =========================================================================

  describe('(b) cascade tiers via mocked useCurrentUser', () => {
    it('tier 1: displays "First Last" when both names present', () => {
      mockCurrentUser({ user: makeUser({ firstName: 'Ada', lastName: 'Lovelace' }) });
      renderSidebar();
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    });

    it('tier 2: displays single name when only firstName present', () => {
      mockCurrentUser({ user: makeUser({ firstName: 'Ada', lastName: '' }) });
      renderSidebar();
      expect(screen.getByText('Ada')).toBeInTheDocument();
    });

    it('tier 3: displays email local-part when no names', () => {
      mockCurrentUser({ user: makeUser({ firstName: '', lastName: '', email: 'ada@example.com' }) });
      renderSidebar();
      expect(screen.getByText('ada')).toBeInTheDocument();
    });

    it('tier 4: displays fallback when loading with no cached data', () => {
      mockCurrentUser({ user: undefined, isPending: true });
      renderSidebar();
      expect(screen.getByText('app.sidebar.userMenu.fallbackName')).toBeInTheDocument();
    });

    it('tier 4: displays fallback when error with no cached data', () => {
      mockCurrentUser({ user: undefined, isError: true });
      renderSidebar();
      expect(screen.getByText('app.sidebar.userMenu.fallbackName')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // (c) FR-018 refetch stability
  // =========================================================================

  describe('(c) FR-018 refetch stability', () => {
    it('cached user + isFetching: true → displays cached tier, NOT tier 4', () => {
      const user = makeUser({ firstName: 'Ada', lastName: 'Lovelace' });
      mockCurrentUser({ user, isPending: false, isFetching: true, isError: false });
      renderSidebar();

      // Should show tier 1 display name, not tier 4 fallback
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.queryByText('app.sidebar.userMenu.fallbackName')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // (d) FR-018 open-menu re-render
  // =========================================================================

  describe('(d) FR-018 open-menu re-render', () => {
    it('tier change while DropdownMenu is open → menu stays open, trigger re-renders', async () => {
      // Start with tier 1 user
      mockCurrentUser({ user: makeUser({ firstName: 'Ada', lastName: 'Lovelace' }) });
      const { rerender } = renderSidebar();
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

      // Open the menu
      await openUserMenu();

      // The menu should be open — verify logout item is visible
      expect(screen.getByRole('menuitem', { name: /app\.sidebar\.userMenu\.logout/ })).toBeInTheDocument();

      // Change mock to tier 2 (only firstName)
      mockCurrentUser({ user: makeUser({ firstName: 'Bob', lastName: '' }) });

      // Rerender with same MemoryRouter path
      rerender(
        <MemoryRouter initialEntries={['/app/notebooks']}>
          <AppSidebar />
        </MemoryRouter>,
      );

      // Menu should still be open (logout item still visible)
      expect(screen.getByRole('menuitem', { name: /app\.sidebar\.userMenu\.logout/ })).toBeInTheDocument();

      // The trigger should now show "Bob" instead of "Ada Lovelace"
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // (e) Logout success path
  // =========================================================================

  describe('(e) logout success path', () => {
    it('click "Log out" → logout() called → clearAuth() called → navigate to /login', async () => {
      mockLogout.mockResolvedValue(undefined);
      renderSidebar();

      await openUserMenu();

      const logoutItem = screen.getByRole('menuitem', { name: /app\.sidebar\.userMenu\.logout/ });

      await act(async () => {
        fireEvent.click(logoutItem);
      });

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });

      expect(useAuthStore.getState().isLoggingOut).toBe(false); // clearAuth resets it
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      expect(mockToastError).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // (f) FR-013b logout-API-failure path
  // =========================================================================

  describe('(f) FR-013b logout API failure path', () => {
    it('logout() rejects → clearAuth() still called → navigate to /login → toast shown', async () => {
      mockLogout.mockRejectedValue(new Error('Network error'));
      renderSidebar();

      await openUserMenu();

      const logoutItem = screen.getByRole('menuitem', { name: /app\.sidebar\.userMenu\.logout/ });

      await act(async () => {
        fireEvent.click(logoutItem);
      });

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });

      // clearAuth should still be called (finally block)
      expect(useAuthStore.getState().isLoggingOut).toBe(false);
      // Navigate should still happen
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      // Toast should show the logoutLocalOnly message
      expect(mockToastError).toHaveBeenCalledWith('app.sidebar.userMenu.logoutLocalOnly');
    });
  });

  // =========================================================================
  // (g) FR-013c double-submit guard
  // =========================================================================

  describe('(g) FR-013c double-submit guard', () => {
    it('when isLoggingOut is true, "Log out" menu item is disabled', async () => {
      useAuthStore.setState({ isLoggingOut: true });
      renderSidebar();

      await openUserMenu();

      const logoutItem = screen.getByRole('menuitem', { name: /app\.sidebar\.userMenu\.logout/ });
      expect(logoutItem).toHaveAttribute('data-disabled');
    });

    it('when isLoggingOut is true, clicking "Log out" does not call handleLogout', async () => {
      useAuthStore.setState({ isLoggingOut: true });
      renderSidebar();

      await openUserMenu();

      const logoutItem = screen.getByRole('menuitem', { name: /app\.sidebar\.userMenu\.logout/ });

      await act(async () => {
        fireEvent.click(logoutItem);
      });

      expect(mockLogout).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // (h) aria-current="page" on active link (FR-027)
  // =========================================================================

  describe('(h) aria-current="page" accessibility (FR-027)', () => {
    it('active link has aria-current="page"', () => {
      renderSidebar('/app/notebooks');
      const notebooksLink = screen.getByRole('link', { name: /app\.sidebar\.nav\.notebooks/ });
      expect(notebooksLink).toHaveAttribute('aria-current', 'page');
    });

    it('inactive links do not have aria-current', () => {
      renderSidebar('/app/notebooks');
      const chordsLink = screen.getByRole('link', { name: /app\.sidebar\.nav\.chords/ });
      const exportsLink = screen.getByRole('link', { name: /app\.sidebar\.nav\.exports/ });
      expect(chordsLink).not.toHaveAttribute('aria-current');
      expect(exportsLink).not.toHaveAttribute('aria-current');
    });

    it('when no entry is active, no link has aria-current', () => {
      renderSidebar('/app/profile');
      const allNavLinks = screen
        .getAllByRole('link')
        .filter((el) => el.getAttribute('aria-current') === 'page');
      expect(allNavLinks).toHaveLength(0);
    });
  });

  // =========================================================================
  // (i) FR-023 bounding-rectangle regression
  // =========================================================================

  describe('(i) FR-023 bounding-rectangle regression', () => {
    it('sidebar layout dimensions are unchanged when a mocked notebook-sheet is toggled', () => {
      // Render the sidebar alongside a sibling that simulates a notebook sheet
      const { rerender } = render(
        <MemoryRouter initialEntries={['/app/notebooks/abc']}>
          <div style={{ display: 'flex' }}>
            <AppSidebar />
            <main style={{ flex: 1 }}>
              {/* Sheet is closed */}
            </main>
          </div>
        </MemoryRouter>,
      );

      const sidebarElement = screen.getByRole('navigation', { name: /app\.sidebar\.nav\.label/ })
        .closest('aside');
      expect(sidebarElement).not.toBeNull();
      const sidebar = sidebarElement!;
      const widthBefore = sidebar.offsetWidth;
      const leftBefore = sidebar.offsetLeft;

      // Rerender with the sheet "open" — a div inside main simulating the sheet overlay
      rerender(
        <MemoryRouter initialEntries={['/app/notebooks/abc']}>
          <div style={{ display: 'flex' }}>
            <AppSidebar />
            <main style={{ flex: 1, position: 'relative' }}>
              {/* Sheet open — absolutely positioned inside main, NOT portal */}
              <div
                data-testid="mock-notebook-sheet"
                style={{ position: 'absolute', left: 0, top: 0, width: 320, height: '100%' }}
              />
            </main>
          </div>
        </MemoryRouter>,
      );

      const widthAfter = sidebar.offsetWidth;
      const leftAfter = sidebar.offsetLeft;

      // The sidebar dimensions MUST NOT change when the sheet opens
      expect(widthAfter).toBe(widthBefore);
      expect(leftAfter).toBe(leftBefore);
    });
  });
});
