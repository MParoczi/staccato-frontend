import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLesson } from '@/api/lessons';
import type { LessonDetail } from '@/lib/types';

export function useCreateLesson(notebookId: string) {
  const queryClient = useQueryClient();

  return useMutation<LessonDetail, Error, { title: string }>({
    mutationFn: (data) => createLesson(notebookId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'lessons'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'index'],
      });
    },
  });
}
