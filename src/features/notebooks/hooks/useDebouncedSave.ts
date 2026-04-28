import { useCallback, useEffect, useRef } from 'react';

/**
 * Generic debounced-save hook used by the editor (CONTEXT decision 5: shared
 * 1000 ms debounce for all dirty-state→server flushes). Models the
 * timer + snapshot pattern from `useModuleLayoutMutations.ts` but is
 * agnostic of the payload type.
 *
 * - Refs over state: avoids re-rendering the consumer on every keystroke.
 * - `flush()` runs any pending save synchronously and returns its promise
 *   (or `undefined` if nothing was queued) so callers can `await` before
 *   navigating, exporting, etc.
 * - `cancel()` drops the pending save entirely.
 * - Unmount cleanup clears the timer so a tear-down does not produce a
 *   stale `onSave`.
 *
 * Rejections from `onSave` are propagated through the `flush()` promise —
 * the hook does not swallow them. Consumers decide whether to retry,
 * surface an error toast, etc.
 */
export interface UseDebouncedSaveOptions<T> {
  delayMs: number;
  onSave: (value: T) => Promise<unknown>;
}

export interface UseDebouncedSaveResult<T> {
  /** Schedule a save; coalesces with any prior pending call. */
  schedule: (value: T) => void;
  /** Fire any pending save NOW; returns the in-flight promise (or undefined if nothing pending). */
  flush: () => Promise<unknown> | undefined;
  /** Drop any pending save without firing. */
  cancel: () => void;
  /** True while the most recently dispatched save is in flight. */
  isSaving: () => boolean;
}

interface PendingMarker {
  has: boolean;
}

export function useDebouncedSave<T>(
  opts: UseDebouncedSaveOptions<T>,
): UseDebouncedSaveResult<T> {
  const { delayMs } = opts;
  // Keep the latest onSave in a ref so consumers can pass an inline closure
  // without breaking the stable identity of `schedule` / `flush` / `cancel`.
  const onSaveRef = useRef(opts.onSave);
  onSaveRef.current = opts.onSave;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<T | undefined>(undefined);
  const pendingMarkerRef = useRef<PendingMarker>({ has: false });
  const inFlightRef = useRef<Promise<unknown> | null>(null);

  const dispatch = useCallback((value: T): Promise<unknown> => {
    const p = onSaveRef.current(value);
    inFlightRef.current = p;
    // Track settlement without producing an unhandled-rejection branch.
    // We use .then(success, failure) instead of .finally() because
    // .finally() returns a new promise that re-rejects on failure, which
    // would surface as an unhandled rejection if the caller does not chain
    // off our return value (they may also await it — both must work).
    p.then(
      () => {
        if (inFlightRef.current === p) inFlightRef.current = null;
      },
      () => {
        if (inFlightRef.current === p) inFlightRef.current = null;
      },
    );
    return p;
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pendingValueRef.current = value;
      pendingMarkerRef.current.has = true;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const v = pendingValueRef.current as T;
        pendingValueRef.current = undefined;
        pendingMarkerRef.current.has = false;
        dispatch(v);
      }, delayMs);
    },
    [delayMs, dispatch],
  );

  const flush = useCallback((): Promise<unknown> | undefined => {
    if (!pendingMarkerRef.current.has) return undefined;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const v = pendingValueRef.current as T;
    pendingValueRef.current = undefined;
    pendingMarkerRef.current.has = false;
    return dispatch(v);
  }, [dispatch]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingValueRef.current = undefined;
    pendingMarkerRef.current.has = false;
  }, []);

  const isSaving = useCallback(() => inFlightRef.current !== null, []);

  // Cleanup: cancel any pending timer on unmount so a save does not fire
  // after the consumer is gone.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pendingValueRef.current = undefined;
      pendingMarkerRef.current.has = false;
    };
  }, []);

  return { schedule, flush, cancel, isSaving };
}


