import { useQuery } from '@tanstack/react-query';
import { getNotebookIndex } from '@/api/notebooks';

export function useNotebookIndex(notebookId: string) {
  return useQuery({
    queryKey: ['notebooks', notebookId, 'index'],
    queryFn: () => getNotebookIndex(notebookId),
    staleTime: 0,
  });
}
