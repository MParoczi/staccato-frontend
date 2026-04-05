import { useQuery } from '@tanstack/react-query';
import { getLessons } from '@/api/lessons';

export function useLessons(notebookId: string) {
  return useQuery({
    queryKey: ['notebooks', notebookId, 'lessons'],
    queryFn: () => getLessons(notebookId),
    staleTime: 0,
  });
}
