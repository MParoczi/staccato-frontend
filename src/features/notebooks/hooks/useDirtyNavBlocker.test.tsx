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
});

