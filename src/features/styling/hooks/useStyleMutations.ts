import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  applyPresetToNotebook,
  updateNotebookStyles,
} from '@/api/notebooks';
import type {
  NotebookModuleStyle,
  UpdateNotebookStyleInput,
} from '@/lib/types';

interface StylesMutationContext {
  previous: NotebookModuleStyle[] | undefined;
}

function buildOptimisticStyles(
  previous: readonly NotebookModuleStyle[] | undefined,
  inputs: readonly UpdateNotebookStyleInput[],
): NotebookModuleStyle[] {
  const prevMap = new Map(
    (previous ?? []).map((style) => [style.moduleType, style]),
  );
  return inputs.map((input) => {
    const prev = prevMap.get(input.moduleType);
    return {
      id: prev?.id ?? '',
      notebookId: prev?.notebookId ?? '',
      ...input,
    };
  });
}

/**
 * Optimistic bulk-save of all 12 notebook styles. Rolls back cache state on
 * error and shows a success/destructive toast.
 */
export function useSaveNotebookStyles(notebookId: string | undefined) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const queryKey = ['notebooks', notebookId, 'styles'] as const;

  return useMutation<
    NotebookModuleStyle[],
    unknown,
    UpdateNotebookStyleInput[],
    StylesMutationContext
  >({
    mutationFn: (styles) =>
      updateNotebookStyles(notebookId as string, [...styles]),
    onMutate: async (styles) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<NotebookModuleStyle[]>(queryKey);
      queryClient.setQueryData<NotebookModuleStyle[]>(
        queryKey,
        buildOptimisticStyles(previous, styles),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(t('styling.drawer.saveError'));
    },
    onSuccess: (data) => {
      queryClient.setQueryData<NotebookModuleStyle[]>(queryKey, data);
      toast.success(t('styling.drawer.saveSuccess'));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

interface ApplyPresetContext {
  previous: NotebookModuleStyle[] | undefined;
}

/**
 * Applies a system or user preset to the current notebook with optimistic
 * cache updates and rollback on error.
 */
export function useApplyPresetToNotebook(notebookId: string | undefined) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const queryKey = ['notebooks', notebookId, 'styles'] as const;

  return useMutation<
    NotebookModuleStyle[],
    unknown,
    string,
    ApplyPresetContext
  >({
    mutationFn: (presetId) =>
      applyPresetToNotebook(notebookId as string, presetId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<NotebookModuleStyle[]>(queryKey);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(t('styling.drawer.applyError'));
    },
    onSuccess: (data) => {
      queryClient.setQueryData<NotebookModuleStyle[]>(queryKey, data);
      toast.success(t('styling.drawer.applySuccess'));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
