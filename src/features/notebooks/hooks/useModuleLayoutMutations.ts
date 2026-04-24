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

  return {
    updateLayoutMutation,
    createModuleMutation,
    deleteModuleMutation,
  };
}
