import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useProactiveRefresh } from './useProactiveRefresh';
import { useAuthStore } from '@/stores/authStore';

const silentRefreshMock = vi.fn();

vi.mock('@/api/client', () => ({
  silentRefresh: () => silentRefreshMock(),
}));

describe('useProactiveRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    silentRefreshMock.mockReset();
    useAuthStore.setState({ accessToken: null, expiresAt: null, isLoggingOut: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('attaches a rejection handler to silentRefresh to avoid unhandled rejections', async () => {
    const rejection = new Error('refresh failed');
    const refreshPromise = Promise.reject(rejection);
    // Attach our own terminal handler FIRST so the rejection is observed by
    // the test runtime regardless of what the hook does.
    refreshPromise.catch(() => {});
    // Now spy on .catch so we only record calls made by the hook.
    const catchSpy = vi.spyOn(refreshPromise, 'catch');

    silentRefreshMock.mockReturnValue(refreshPromise);

    useAuthStore.setState({
      accessToken: 'token',
      expiresAt: Date.now() + 10_000,
    });

    renderHook(() => useProactiveRefresh());

    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(silentRefreshMock).toHaveBeenCalledTimes(1);
    // The hook must attach its own .catch to the returned promise so that a
    // rejection does not bubble up as an unhandled promise rejection.
    expect(catchSpy).toHaveBeenCalled();
  });

  it('does not schedule a refresh when expiresAt is null', () => {
    renderHook(() => useProactiveRefresh());
    vi.advanceTimersByTime(100_000);
    expect(silentRefreshMock).not.toHaveBeenCalled();
  });
});
