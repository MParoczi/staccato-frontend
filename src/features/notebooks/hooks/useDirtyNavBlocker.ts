import { useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router';
import type { ContentSaveStatus } from './useModuleContentMutation';

export interface UseDirtyNavBlockerArgs {
  /** True while the editor surface is mounted in edit mode. */
  isEditing: boolean;
  /** Most-recent save status from `useModuleContentMutation`. */
  saveStatus: ContentSaveStatus;
  /**
   * True iff the editor has unpersisted edits. Includes the post-keystroke
   * pre-debounce window AND the in-flight PUT window (gap 01-09). Defaults
   * to `false` when not supplied so legacy call sites keep the original
   * "fail-only" semantics.
   */
  isDirty?: boolean;
  /** Imperative flush (best-effort retry of the pending PUT). */
  flushPendingSave: () => Promise<unknown> | undefined;
}

export interface UseDirtyNavBlockerResult {
  /** True iff the user must explicitly choose to discard or keep editing. */
  isBlocked: boolean;
  /** Allow the queued navigation to proceed. */
  proceed: () => void;
  /** Cancel the queued navigation; user stays in edit mode. */
  reset: () => void;
}

/**
 * React Router v7 navigation guard for the in-flight Phase 1 module editor.
 *
 * Per gap 01-09 the dialog fires whenever the editor has unpersisted edits
 * — i.e. `isEditing && (isDirty || saveStatus === 'failed')`. The "dirty"
 * window covers both the post-keystroke pre-debounce gap (the original
 * UAT T11 failure mode) and the in-flight PUT. When blocked we attempt
 * one last `flushPendingSave()` retry; on resolve we auto-`proceed()`
 * (silent recovery) and on reject we surface `isBlocked = true` so the
 * host can render `<UnsavedChangesDialog />`.
 *
 * Also installs a `beforeunload` listener while dirty so browser-back /
 * Cmd+R / tab close trigger the browser's native confirmation prompt.
 *
 * Requires the data router (`createBrowserRouter`) — see `src/routes/index.tsx`.
 */
export function useDirtyNavBlocker({
  isEditing,
  saveStatus,
  isDirty = false,
  flushPendingSave,
}: UseDirtyNavBlockerArgs): UseDirtyNavBlockerResult {
  const shouldBlock = isEditing && (isDirty || saveStatus === 'failed');
  const blocker = useBlocker(shouldBlock);
  const [isBlocked, setIsBlocked] = useState(false);
  const retryingRef = useRef(false);

  // ─── beforeunload (hard navigation: tab close, reload, browser back) ──
  // The router blocker only covers in-app SPA navigation; for hard
  // navigations the only safety net is `beforeunload`. We track dirtiness
  // through a ref so the listener (registered once on mount) always reads
  // the live value without re-binding.
  const dirtyRef = useRef(shouldBlock);
  useEffect(() => {
    dirtyRef.current = shouldBlock;
  }, [shouldBlock]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      // Both calls are required — Chrome respects preventDefault, others
      // need returnValue set (deprecated but still mandatory in 2026).
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      // Reset state when navigation is no longer queued. Setting state from
      // an effect here is intentional: blocker.state is an external value
      // (router subscription), not derivable from props.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsBlocked(false);
      retryingRef.current = false;
      return;
    }
    if (retryingRef.current) return;
    retryingRef.current = true;

    const retry = flushPendingSave();
    if (!retry) {
      // Nothing pending → surface the dialog so the user decides.
      retryingRef.current = false;
      setIsBlocked(true);
      return;
    }
    Promise.resolve(retry)
      .then(() => {
        retryingRef.current = false;
        if (blocker.state === 'blocked') {
          blocker.proceed();
        }
      })
      .catch(() => {
        retryingRef.current = false;
        setIsBlocked(true);
      });
  }, [blocker, flushPendingSave]);

  return {
    isBlocked,
    proceed: () => {
      if (blocker.state === 'blocked') blocker.proceed();
    },
    reset: () => {
      if (blocker.state === 'blocked') blocker.reset();
      setIsBlocked(false);
    },
  };
}

