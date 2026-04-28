import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedSave } from './useDebouncedSave';

describe('useDebouncedSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not save before the delay and saves once after the delay', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedSave<string>({ delayMs: 1000, onSave }),
    );

    act(() => result.current.schedule('a'));
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onSave).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('a');
  });

  it('coalesces a burst of schedules into a single save with the last value', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedSave<string>({ delayMs: 1000, onSave }),
    );

    act(() => {
      result.current.schedule('1');
      result.current.schedule('2');
      result.current.schedule('3');
      result.current.schedule('4');
      result.current.schedule('5');
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('5');
  });

  it('flush() fires the pending save immediately and prevents the delayed fire', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedSave<string>({ delayMs: 1000, onSave }),
    );

    act(() => result.current.schedule('hi'));
    let p: ReturnType<typeof result.current.flush>;
    act(() => {
      p = result.current.flush();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('hi');
    expect(p).toBeInstanceOf(Promise);

    // Advance past the original delay — must NOT fire again.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('flush() with nothing pending returns undefined and does not call onSave', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedSave<string>({ delayMs: 1000, onSave }),
    );
    let out: ReturnType<typeof result.current.flush>;
    act(() => {
      out = result.current.flush();
    });
    expect(out).toBeUndefined();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('cancel() drops the pending save and no save fires', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedSave<string>({ delayMs: 1000, onSave }),
    );

    act(() => result.current.schedule('drop-me'));
    act(() => result.current.cancel());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not fire a save scheduled before unmount', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() =>
      useDebouncedSave<string>({ delayMs: 1000, onSave }),
    );

    act(() => result.current.schedule('x'));
    unmount();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('propagates rejection through the flush() promise', async () => {
    const err = new Error('boom');
    const onSave = vi.fn().mockRejectedValue(err);
    const { result } = renderHook(() =>
      useDebouncedSave<string>({ delayMs: 1000, onSave }),
    );

    act(() => result.current.schedule('y'));
    let p: Promise<unknown> | undefined;
    act(() => {
      p = result.current.flush();
    });
    await expect(p).rejects.toBe(err);
  });

  it('isSaving() is true between dispatch and settle', async () => {
    let resolveSave!: () => void;
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    const { result } = renderHook(() =>
      useDebouncedSave<string>({ delayMs: 1000, onSave }),
    );

    expect(result.current.isSaving()).toBe(false);
    act(() => result.current.schedule('z'));
    let p: Promise<unknown> | undefined;
    act(() => {
      p = result.current.flush();
    });
    expect(result.current.isSaving()).toBe(true);
    resolveSave();
    await act(async () => {
      await p;
    });
    expect(result.current.isSaving()).toBe(false);
  });

  it('schedule / flush / cancel / isSaving have stable identity across re-renders', () => {
    const { result, rerender } = renderHook(
      ({ delayMs }: { delayMs: number }) =>
        useDebouncedSave<string>({ delayMs, onSave: vi.fn().mockResolvedValue(undefined) }),
      { initialProps: { delayMs: 1000 } },
    );
    const flush1 = result.current.flush;
    const cancel1 = result.current.cancel;
    const isSaving1 = result.current.isSaving;
    rerender({ delayMs: 1000 });
    expect(result.current.flush).toBe(flush1);
    expect(result.current.cancel).toBe(cancel1);
    expect(result.current.isSaving).toBe(isSaving1);
  });
});

