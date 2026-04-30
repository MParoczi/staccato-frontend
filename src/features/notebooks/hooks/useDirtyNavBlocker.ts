import { useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router';
import type { ContentSaveStatus } from './useModuleContentMutation';

export interface UseDirtyNavBlockerArgs {
  /** True while the editor surface is mounted in edit mode. */
  isEditing: boolean;
  /** Most-recent save status from `useModuleContentMutation`. */
  saveStatus: ContentSaveStatus;
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
 * Per CONTEXT.md decision 4 the dialog only fires when there are *actually*
 * unsaved changes the server rejected — i.e. `isEditing && saveStatus ===
 * 'failed'`. Successful debounced saves never trigger.
 *
 * When the blocker fires we attempt one final `flushPendingSave()` retry; on
 * resolve we auto-`proceed()` (silent recovery) and on reject we surface
 * `isBlocked = true` so the host can render `<UnsavedChangesDialog />`.
 *
 * Requires the data router (`createBrowserRouter`) — see `src/routes/index.tsx`.
 */
export function useDirtyNavBlocker({
  isEditing,
  saveStatus,
  flushPendingSave,
}: UseDirtyNavBlockerArgs): UseDirtyNavBlockerResult {
  const shouldBlock = isEditing && saveStatus === 'failed';
  const blocker = useBlocker(shouldBlock);
  const [isBlocked, setIsBlocked] = useState(false);
  const retryingRef = useRef(false);

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

