import { useQuery } from '@tanstack/react-query';
import { getNotebook } from '@/api/notebooks';

export function useNotebook(notebookId: string) {
  return useQuery({
    queryKey: ['notebooks', notebookId],
    queryFn: () => getNotebook(notebookId),
    staleTime: 0,
  });
}
