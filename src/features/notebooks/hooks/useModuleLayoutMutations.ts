import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  createModule as createModuleRequest,
  deleteModule as deleteModuleRequest,
  updateModuleLayout as updateModuleLayoutRequest,
} from '@/api/modules';
import type {
  CreateModuleInput,
  Module,
  UpdateModuleLayoutInput,
} from '@/lib/types';
import { getMaxZIndex } from '@/features/notebooks/utils/z-index';
import { pageModulesQueryKey } from './usePageModules';

/**
 * Debounce window for server-side layout persistence. Matches the
 * 500 ms delay documented in plan.md so users see optimistic updates
 * immediately while drag/resize flurries coalesce into a single PATCH.
 */
export const LAYOUT_SAVE_DEBOUNCE_MS = 500;

interface UseModuleLayoutMutationsArgs {
  pageId: string;
}

interface UpdateLayoutVariables {
  moduleId: string;
  layout: UpdateModuleLayoutInput;
}

interface MutationContext {
  previousModules: Module[] | undefined;
}

/**
 * Read the localized server message embedded in an Axios-style error
 * response, falling back to a generic toast string when the response does
 * not include one. The shared error shape (`{ message }`) matches the
 * backend conventions already used by other notebook mutations.
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
    typeof error.response.data === 'object' &&
    'message' in error.response.data &&
    typeof (error.response.data as { message: unknown }).message === 'string'
  ) {
    return (error.response.data as { message: string }).message;
  }
  return fallback;
}

/**
 * Shared optimistic-mutation scaffold for module layout operations on a page.
 *
 * Each mutation follows the constitution-mandated `onMutate`/`onError`/
 * `onSettled` pattern against the `['pages', pageId, 'modules']` cache.
 * The scaffold owns cache snapshot/restore, query invalidation, and
 * localized toast feedback so individual user-story tasks can layer in
 * 500 ms debounced layout persistence and validation-code mapping later.
 */
export function useModuleLayoutMutations({
  pageId,
}: UseModuleLayoutMutationsArgs) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const queryKey = pageModulesQueryKey(pageId);

  function snapshotPreviousModules(): Module[] | undefined {
    return queryClient.getQueryData<Module[]>(queryKey);
  }

  function restorePreviousModules(previous: Module[] | undefined): void {
    queryClient.setQueryData<Module[]>(queryKey, previous);
  }

  const updateLayoutMutation = useMutation<
    Module,
    unknown,
    UpdateLayoutVariables,
    MutationContext
  >({
    mutationFn: ({ moduleId, layout }) =>
      updateModuleLayoutRequest(moduleId, layout),
    onMutate: async ({ moduleId, layout }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousModules = snapshotPreviousModules();
      queryClient.setQueryData<Module[]>(queryKey, (old) =>
        old?.map((m) => (m.id === moduleId ? { ...m, ...layout } : m)) ?? [],
      );
      return { previousModules };
    },
    onSuccess: (savedModule) => {
      queryClient.setQueryData<Module[]>(queryKey, (old) =>
        old?.map((m) => (m.id === savedModule.id ? savedModule : m)) ?? [],
      );
    },
    onError: (error, _vars, context) => {
      restorePreviousModules(context?.previousModules);
      toast.error(
        readServerMessage(
          error,
          t('notebooks.canvas.toasts.layoutSaveFailed'),
        ),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const createModuleMutation = useMutation<
    Module,
    unknown,
    CreateModuleInput,
    MutationContext
  >({
    mutationFn: (input) => createModuleRequest(pageId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previousModules = snapshotPreviousModules();
      const optimisticModule: Module = {
        id: `optimistic-${Date.now()}`,
        lessonPageId: pageId,
        moduleType: input.moduleType,
        gridX: input.gridX,
        gridY: input.gridY,
        gridWidth: input.gridWidth,
        gridHeight: input.gridHeight,
        zIndex: previousModules ? getMaxZIndex(previousModules) + 1 : 0,
        content: [],
      };
      queryClient.setQueryData<Module[]>(queryKey, (old) => [
        ...(old ?? []),
        optimisticModule,
      ]);
      return { previousModules };
    },
    onError: (error, _vars, context) => {
      restorePreviousModules(context?.previousModules);
      toast.error(
        readServerMessage(error, t('notebooks.canvas.toasts.addFailed')),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteModuleMutation = useMutation<
    void,
    unknown,
    string,
    MutationContext
  >({
    mutationFn: (moduleId) => deleteModuleRequest(moduleId),
    onMutate: async (moduleId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousModules = snapshotPreviousModules();
      queryClient.setQueryData<Module[]>(queryKey, (old) =>
        old?.filter((m) => m.id !== moduleId) ?? [],
      );
      return { previousModules };
    },
    onError: (error, _vars, context) => {
      restorePreviousModules(context?.previousModules);
      toast.error(
        readServerMessage(error, t('notebooks.canvas.toasts.deleteFailed')),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  /**
   * Per-module snapshots of the *pre-interaction* module so a rollback
   * after server rejection restores the user's original layout even when
   * several optimistic updates landed during a drag or resize session.
   * The snapshot is captured once on the first `scheduleLayoutUpdate` for
   * a module and cleared once the server confirms or rolls back.
   */
  const pendingSnapshots = useRef(new Map<string, Module | undefined>());
  const pendingTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  /**
   * Clear any queued debounce timers on unmount so in-flight saves do not
   * fire after the canvas is gone.
   */
  useEffect(() => {
    const timers = pendingTimers.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const runLayoutSave = useCallback(
    (moduleId: string, layout: UpdateModuleLayoutInput) => {
      pendingTimers.current.delete(moduleId);
      updateModuleLayoutRequest(moduleId, layout)
        .then((saved) => {
          pendingSnapshots.current.delete(moduleId);
          queryClient.setQueryData<Module[]>(queryKey, (old) =>
            old?.map((m) => (m.id === saved.id ? saved : m)) ?? [],
          );
          void queryClient.invalidateQueries({ queryKey });
        })
        .catch((error) => {
          const original = pendingSnapshots.current.get(moduleId);
          pendingSnapshots.current.delete(moduleId);
          queryClient.setQueryData<Module[]>(queryKey, (old) => {
            if (!old) return old;
            return old.map((m) => {
              if (m.id !== moduleId) return m;
              return original ?? m;
            });
          });
          toast.error(
            readServerMessage(
              error,
              t('notebooks.canvas.toasts.layoutSaveFailed'),
            ),
          );
          void queryClient.invalidateQueries({ queryKey });
        });
    },
    [queryClient, queryKey, t],
  );

  /**
   * Apply a snapped layout change optimistically and schedule the server
   * PATCH to run `LAYOUT_SAVE_DEBOUNCE_MS` (500 ms) later. Consecutive
   * calls for the same module collapse into a single PATCH with the
   * latest layout, preserving the original pre-interaction snapshot for
   * rollback on server rejection.
   */
  const scheduleLayoutUpdate = useCallback(
    (moduleId: string, layout: UpdateModuleLayoutInput) => {
      if (!pendingSnapshots.current.has(moduleId)) {
        // Store the original reference directly. It is only read during
        // a rollback and is never mutated, so a shallow copy would be
        // redundant.
        const original = queryClient
          .getQueryData<Module[]>(queryKey)
          ?.find((m) => m.id === moduleId);
        pendingSnapshots.current.set(moduleId, original);
      }
      queryClient.setQueryData<Module[]>(queryKey, (old) =>
        old?.map((m) => (m.id === moduleId ? { ...m, ...layout } : m)) ?? [],
      );
      const existing = pendingTimers.current.get(moduleId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        runLayoutSave(moduleId, layout);
      }, LAYOUT_SAVE_DEBOUNCE_MS);
      pendingTimers.current.set(moduleId, timer);
    },
    [queryClient, queryKey, runLayoutSave],
  );

  /**
   * Cancel any queued debounce timers. Used in tests and for pre-unmount
   * flushes. The scheduled callbacks are dropped; consumers that need a
   * synchronous save should call `updateLayoutMutation.mutate` directly.
   */
  const flushPendingLayoutUpdates = useCallback(() => {
    for (const timer of pendingTimers.current.values()) {
      clearTimeout(timer);
    }
    pendingTimers.current.clear();
  }, []);

  return {
    updateLayoutMutation,
    createModuleMutation,
    deleteModuleMutation,
    scheduleLayoutUpdate,
    flushPendingLayoutUpdates,
  };
}
