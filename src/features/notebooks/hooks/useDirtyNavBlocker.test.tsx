import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';
import {
  useDirtyNavBlocker,
  type UseDirtyNavBlockerArgs,
  type UseDirtyNavBlockerResult,
} from './useDirtyNavBlocker';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

interface HarnessProps extends UseDirtyNavBlockerArgs {
  onResult?: (r: UseDirtyNavBlockerResult) => void;
}

function Harness(props: HarnessProps) {
  const result = useDirtyNavBlocker(props);
  props.onResult?.(result);
  return (
    <div>
      <div data-testid="blocked">{String(result.isBlocked)}</div>
      <button type="button" onClick={() => result.proceed()} data-testid="proceed">
        proceed
      </button>
      <button type="button" onClick={() => result.reset()} data-testid="reset">
        reset
      </button>
      <Link to="/other" data-testid="nav">
        go
      </Link>
    </div>
  );
}

function renderHarness(initial: HarnessProps) {
  function Root() {
    return <Harness {...initial} />;
  }
  const router = createMemoryRouter(
    [
      { path: '/', Component: Root },
      { path: '/other', element: <div data-testid="other">other</div> },
    ],
    { initialEntries: ['/'] },
  );
  return { ...render(<RouterProvider router={router} />), router };
}

// React import is required even though Vitest auto-injects JSX runtime in
// some configs — the harness uses it explicitly.
void React;

describe('useDirtyNavBlocker', () => {
  it('not editing → blocker never fires regardless of saveStatus', async () => {
    renderHarness({
      isEditing: false,
      saveStatus: 'failed',
      flushPendingSave: () => undefined,
    });
    fireEvent.click(screen.getByTestId('nav'));
    await screen.findByTestId('other');
    expect(screen.queryByTestId('blocked')).toBeNull();
  });

  it('editing AND saveStatus="idle" (clean) → blocker does not fire', async () => {
    renderHarness({
      isEditing: true,
      saveStatus: 'idle',
      flushPendingSave: () => undefined,
    });
    fireEvent.click(screen.getByTestId('nav'));
    await screen.findByTestId('other');
  });

  it('editing AND saveStatus="failed" AND retry rejects → isBlocked becomes true', async () => {
    const flush = vi.fn(() => Promise.reject(new Error('still 422')));
    renderHarness({
      isEditing: true,
      saveStatus: 'failed',
      flushPendingSave: flush,
    });
    fireEvent.click(screen.getByTestId('nav'));
    await waitFor(() =>
      expect(screen.getByTestId('blocked').textContent).toBe('true'),
    );
    expect(flush).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('other')).toBeNull();
  });

  it('editing AND saveStatus="failed" AND retry resolves → blocker auto-proceeds', async () => {
    const flush = vi.fn(() => Promise.resolve({ ok: true }));
    renderHarness({
      isEditing: true,
      saveStatus: 'failed',
      flushPendingSave: flush,
    });
    fireEvent.click(screen.getByTestId('nav'));
    await screen.findByTestId('other');
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('editing + failed + nothing pending (flush returns undefined) → isBlocked true', async () => {
    const flush = vi.fn(() => undefined);
    renderHarness({
      isEditing: true,
      saveStatus: 'failed',
      flushPendingSave: flush,
    });
    fireEvent.click(screen.getByTestId('nav'));
    await waitFor(() =>
      expect(screen.getByTestId('blocked').textContent).toBe('true'),
    );
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('proceed() allows the queued navigation', async () => {
    const flush = vi.fn(() => Promise.reject(new Error('boom')));
    renderHarness({
      isEditing: true,
      saveStatus: 'failed',
      flushPendingSave: flush,
    });
    fireEvent.click(screen.getByTestId('nav'));
    await waitFor(() =>
      expect(screen.getByTestId('blocked').textContent).toBe('true'),
    );
    act(() => {
      fireEvent.click(screen.getByTestId('proceed'));
    });
    await screen.findByTestId('other');
  });

  it('reset() cancels the queued navigation', async () => {
    const flush = vi.fn(() => Promise.reject(new Error('boom')));
    renderHarness({
      isEditing: true,
      saveStatus: 'failed',
      flushPendingSave: flush,
    });
    fireEvent.click(screen.getByTestId('nav'));
    await waitFor(() =>
      expect(screen.getByTestId('blocked').textContent).toBe('true'),
    );
    act(() => {
      fireEvent.click(screen.getByTestId('reset'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('blocked').textContent).toBe('false'),
    );
    expect(screen.queryByTestId('other')).toBeNull();
  });

  describe('dirty-nav guard (gap 01-09)', () => {
    /**
     * Pre-fix the blocker only fired on `saveStatus === 'failed'`. UAT
     * Test 11 reported that navigating during an *unfailed-but-dirty*
     * window (the 1000 ms debounce gap, OR an in-flight PUT that hasn't
     * resolved yet) lost the user's edits silently. Post-fix the blocker
     * also fires when `isDirty === true`, attempts a flush retry, and
     * either auto-proceeds on success or surfaces the dialog on failure.
     */

    it('editing + isDirty + flush succeeds → blocker auto-proceeds (no dialog)', async () => {
      const flush = vi.fn(() => Promise.resolve({ ok: true }));
      renderHarness({
        isEditing: true,
        saveStatus: 'idle',
        isDirty: true,
        flushPendingSave: flush,
      });
      fireEvent.click(screen.getByTestId('nav'));
      await screen.findByTestId('other');
      expect(flush).toHaveBeenCalledTimes(1);
      // After navigation completes the harness is unmounted; absence of
      // the dialog (which would block the URL change) is the assertion.
    });

    it('editing + isDirty + flush rejects → dialog surfaces, navigation deferred', async () => {
      const flush = vi.fn(() => Promise.reject(new Error('server 500')));
      renderHarness({
        isEditing: true,
        saveStatus: 'idle',
        isDirty: true,
        flushPendingSave: flush,
      });
      fireEvent.click(screen.getByTestId('nav'));
      await waitFor(() =>
        expect(screen.getByTestId('blocked').textContent).toBe('true'),
      );
      expect(flush).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('other')).toBeNull();
    });

    it('editing + isDirty + nothing pending (flush returns undefined) → dialog surfaces', async () => {
      const flush = vi.fn(() => undefined);
      renderHarness({
        isEditing: true,
        saveStatus: 'idle',
        isDirty: true,
        flushPendingSave: flush,
      });
      fireEvent.click(screen.getByTestId('nav'));
      await waitFor(() =>
        expect(screen.getByTestId('blocked').textContent).toBe('true'),
      );
      expect(screen.queryByTestId('other')).toBeNull();
    });

    it('editing + isDirty=false + saveStatus=idle → blocker does NOT fire (clean path)', async () => {
      renderHarness({
        isEditing: true,
        saveStatus: 'idle',
        isDirty: false,
        flushPendingSave: () => undefined,
      });
      fireEvent.click(screen.getByTestId('nav'));
      await screen.findByTestId('other');
      // After navigation the harness is gone; reaching '/other' is itself
      // the proof the blocker did not fire.
    });

    it('editing + isDirty + Discard (proceed) → navigation completes, dialog closes', async () => {
      const flush = vi.fn(() => Promise.reject(new Error('server 500')));
      renderHarness({
        isEditing: true,
        saveStatus: 'idle',
        isDirty: true,
        flushPendingSave: flush,
      });
      fireEvent.click(screen.getByTestId('nav'));
      await waitFor(() =>
        expect(screen.getByTestId('blocked').textContent).toBe('true'),
      );
      act(() => {
        fireEvent.click(screen.getByTestId('proceed'));
      });
      await screen.findByTestId('other');
    });

    it('editing + isDirty + Keep Editing (reset) → URL unchanged, dialog closes', async () => {
      const flush = vi.fn(() => Promise.reject(new Error('server 500')));
      const { router } = renderHarness({
        isEditing: true,
        saveStatus: 'idle',
        isDirty: true,
        flushPendingSave: flush,
      });
      fireEvent.click(screen.getByTestId('nav'));
      await waitFor(() =>
        expect(screen.getByTestId('blocked').textContent).toBe('true'),
      );
      act(() => {
        fireEvent.click(screen.getByTestId('reset'));
      });
      await waitFor(() =>
        expect(screen.getByTestId('blocked').textContent).toBe('false'),
      );
      expect(screen.queryByTestId('other')).toBeNull();
      expect(router.state.location.pathname).toBe('/');
    });

    it('beforeunload while dirty → preventDefault called, returnValue set', () => {
      renderHarness({
        isEditing: true,
        saveStatus: 'idle',
        isDirty: true,
        flushPendingSave: () => undefined,
      });
      const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
      // jsdom's Event doesn't initialize returnValue — set the field so we
      // can observe the listener writing to it.
      Object.defineProperty(event, 'returnValue', {
        configurable: true,
        writable: true,
        value: undefined,
      });
      const prevented = !window.dispatchEvent(event);
      expect(prevented).toBe(true);
      expect(event.returnValue).toBe('');
    });

    it('beforeunload while clean → listener no-ops (navigation not blocked)', () => {
      renderHarness({
        isEditing: true,
        saveStatus: 'idle',
        isDirty: false,
        flushPendingSave: () => undefined,
      });
      const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
      Object.defineProperty(event, 'returnValue', {
        configurable: true,
        writable: true,
        value: undefined,
      });
      const prevented = !window.dispatchEvent(event);
      expect(prevented).toBe(false);
    });
  });
});
