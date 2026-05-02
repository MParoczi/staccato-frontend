import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { updateModuleFull } from '@/api/modules';
import type { BuildingBlock, Module } from '@/lib/types';
import { pageModulesQueryKey } from './usePageModules';

/**
 * Shared trailing-edge debounce window for content persistence (CONTEXT
 * decision 5: 1000 ms across all dirty-state→server flushes for the
 * editor).
 */
export const CONTENT_SAVE_DEBOUNCE_MS = 1000;
/** How long the `'saved'` indicator state persists before auto-fading to `'idle'`. */
export const SAVED_INDICATOR_LINGER_MS = 1500;

export type ContentSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export interface UseModuleContentMutationArgs {
  pageId: string;
  moduleId: string;
}

export interface UseModuleContentMutationResult {
  schedule: (nextContent: BuildingBlock[]) => void;
  flush: () => Promise<Module> | undefined;
  cancel: () => void;
  revertOptimistic: () => void;
  status: ContentSaveStatus;
  /**
   * True iff the editor has unpersisted edits the user could lose. Flips
   * synchronously on the first `schedule()` call (debounce window opens),
   * stays true while the PUT is in flight, and clears when the server
   * confirms or the caller explicitly cancels / reverts. Distinct from
   * `status` because the `idle → idle` transition during the 1000 ms
   * debounce window is invisible to status alone (gap 01-09).
   */
  isDirty: boolean;
  lastError: unknown;
}

/**
 * Read the localized server message embedded in an Axios-style error
 * response, or fall back to the supplied default.
 */
function readServerMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object'
  ) {
    const data = error.response.data as { message?: unknown; code?: unknown };
    if (typeof data.message === 'string') return data.message;
  }
  return fallback;
}

/**
 * Read the backend `code` discriminant if present (e.g. `INVALID_BUILDING_BLOCK`,
 * `BREADCRUMB_CONTENT_NOT_EMPTY`). Returns `null` if absent or non-string.
 */
function readErrorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object'
  ) {
    const data = error.response.data as { code?: unknown };
    if (typeof data.code === 'string') return data.code;
  }
  return null;
}

/**
 * Optimistic + debounced content persistence for a single module.
 *
 * Mirrors the snapshot/timer pattern in `useModuleLayoutMutations` but
 * targets `PUT /modules/{moduleId}` via `updateModuleFull`. The pre-edit
 * snapshot is captured on the FIRST `schedule` call after entering edit
 * mode and persists until either `revertOptimistic()` (Cancel) or the next
 * mount cycle clears it.
 *
 * Per CONTEXT decision (F9 prompt line 1449), save failures DO NOT
 * auto-rollback the cache — the user keeps their edits and is surfaced an
 * error toast. The Cancel button is the explicit rollback affordance.
 */
export function useModuleContentMutation({
  pageId,
  moduleId,
}: UseModuleContentMutationArgs): UseModuleContentMutationResult {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const queryKey = pageModulesQueryKey(pageId);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<BuildingBlock[] | null>(null);
  const snapshotRef = useRef<Module | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<ContentSaveStatus>('idle');
  const [lastError, setLastError] = useState<unknown>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const clearSavedTimer = () => {
    if (savedTimerRef.current !== null) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
  };

  /**
   * Apply optimistic content to the page-modules cache for `moduleId`.
   * Always runs through the cache shape `Module[]`.
   */
  const applyOptimisticContent = useCallback(
    (content: BuildingBlock[]) => {
      queryClient.setQueryData<Module[]>(queryKey, (old) =>
        old?.map((m) => (m.id === moduleId ? { ...m, content } : m)) ?? [],
      );
    },
    [moduleId, queryClient, queryKey],
  );

  /**
   * Capture the pre-edit module snapshot once per edit session.
   * Lazy: stays `null` until the first `schedule` call.
   */
  const captureSnapshot = useCallback(() => {
    if (snapshotRef.current !== null) return;
    const current = queryClient
      .getQueryData<Module[]>(queryKey)
      ?.find((m) => m.id === moduleId);
    if (current) {
      snapshotRef.current = { ...current, content: [...current.content] };
    }
  }, [moduleId, queryClient, queryKey]);

  /**
   * Fire `PUT /modules/{moduleId}` with the supplied content. Owns the
   * status transitions and toast feedback.
   */
  const dispatch = useCallback(
    (content: BuildingBlock[]): Promise<Module> => {
      const current = queryClient
        .getQueryData<Module[]>(queryKey)
        ?.find((m) => m.id === moduleId);
      const base =
        current ?? snapshotRef.current ?? null;
      if (!base) {
        // No module in cache yet — bail out gracefully.
        const err = new Error('module-not-in-cache');
        setStatus('failed');
        setLastError(err);
        return Promise.reject(err);
      }
      setStatus('saving');
      setLastError(null);
      return updateModuleFull(moduleId, {
        moduleType: base.moduleType,
        gridX: base.gridX,
        gridY: base.gridY,
        gridWidth: base.gridWidth,
        gridHeight: base.gridHeight,
        zIndex: base.zIndex,
        content,
      })
        .then((saved) => {
          queryClient.setQueryData<Module[]>(queryKey, (old) =>
            old?.map((m) => (m.id === saved.id ? saved : m)) ?? [],
          );
          setStatus('saved');
          setLastError(null);
          setIsDirty(false);
          clearSavedTimer();
          savedTimerRef.current = setTimeout(() => {
            setStatus('idle');
            savedTimerRef.current = null;
          }, SAVED_INDICATOR_LINGER_MS);
          void queryClient.invalidateQueries({ queryKey });
          return saved;
        })
        .catch((error: unknown) => {
          const code = readErrorCode(error);
          let message: string;
          if (code === 'INVALID_BUILDING_BLOCK') {
            message = t('editor.errors.invalidBuildingBlock');
          } else if (code === 'BREADCRUMB_CONTENT_NOT_EMPTY') {
            message = t('editor.errors.breadcrumbContentNotEmpty');
          } else {
            message = readServerMessage(error, t('editor.saveFailed'));
          }
          toast.error(message);
          setStatus('failed');
          setLastError(error);
          // Per CONTEXT decision: keep optimistic state — user retains edits.
          throw error;
        });
    },
    [moduleId, queryClient, queryKey, t],
  );

  const schedule = useCallback(
    (nextContent: BuildingBlock[]) => {
      captureSnapshot();
      applyOptimisticContent(nextContent);
      pendingContentRef.current = nextContent;
      // Flip the dirty flag SYNCHRONOUSLY so the dirty-nav guard
      // (useDirtyNavBlocker) sees unsaved edits the moment the user types,
      // not 1000 ms later when the debounced PUT fires (gap 01-09).
      setIsDirty(true);
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const c = pendingContentRef.current;
        pendingContentRef.current = null;
        if (c !== null) {
          // Swallow rejection here; dispatch already handled toast/state.
          void dispatch(c).catch(() => undefined);
        }
      }, CONTENT_SAVE_DEBOUNCE_MS);
    },
    [applyOptimisticContent, captureSnapshot, dispatch],
  );

  const flush = useCallback((): Promise<Module> | undefined => {
    if (pendingContentRef.current === null) return undefined;
    clearTimer();
    const c = pendingContentRef.current;
    pendingContentRef.current = null;
    return dispatch(c);
  }, [dispatch]);

  const cancel = useCallback(() => {
    clearTimer();
    pendingContentRef.current = null;
    setIsDirty(false);
  }, []);

  const revertOptimistic = useCallback(() => {
    clearTimer();
    clearSavedTimer();
    pendingContentRef.current = null;
    setIsDirty(false);
    if (snapshotRef.current) {
      const snap = snapshotRef.current;
      queryClient.setQueryData<Module[]>(queryKey, (old) =>
        old?.map((m) => (m.id === snap.id ? snap : m)) ?? [],
      );
      snapshotRef.current = null;
    }
    setStatus('idle');
    setLastError(null);
  }, [queryClient, queryKey]);

  // Cleanup: on unmount drop pending timer so a stale PUT never fires.
  useEffect(() => {
    return () => {
      clearTimer();
      clearSavedTimer();
      pendingContentRef.current = null;
    };
  }, []);

  return { schedule, flush, cancel, revertOptimistic, status, isDirty, lastError };
}

