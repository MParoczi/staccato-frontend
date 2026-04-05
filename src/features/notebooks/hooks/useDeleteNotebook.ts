import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { deleteNotebook } from '@/api/notebooks';
import type { NotebookSummary } from '@/lib/types';

export function useDeleteNotebook() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => deleteNotebook(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notebooks'] });
      const previousNotebooks = queryClient.getQueryData<NotebookSummary[]>(['notebooks']);
      queryClient.setQueryData<NotebookSummary[]>(
        ['notebooks'],
        (old) => old?.filter((n) => n.id !== id) ?? [],
      );
      return { previousNotebooks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotebooks) {
        queryClient.setQueryData(['notebooks'], context.previousNotebooks);
      }
      toast.error(t('notebooks.delete.error'));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
}
