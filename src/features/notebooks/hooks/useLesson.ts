import { useQuery } from '@tanstack/react-query';
import { getLesson } from '@/api/lessons';

export function useLesson(notebookId: string, lessonId: string) {
  return useQuery({
    queryKey: ['notebooks', notebookId, 'lessons', lessonId],
    queryFn: () => getLesson(notebookId, lessonId),
    staleTime: 0,
  });
}
