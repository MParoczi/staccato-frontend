import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNotebook } from '@/api/notebooks';
import type { NotebookDetail } from '@/lib/types';

export function useUpdateNotebook(notebookId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    NotebookDetail,
    Error,
    { title?: string; coverColor?: string }
  >({
    mutationFn: (data) => updateNotebook(notebookId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notebooks'],
        exact: true,
      });
    },
  });
}
