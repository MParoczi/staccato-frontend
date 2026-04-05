import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLesson } from '@/api/lessons';
import type { LessonDetail } from '@/lib/types';

export function useUpdateLesson(notebookId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    LessonDetail,
    Error,
    { lessonId: string; title: string }
  >({
    mutationFn: ({ lessonId, title }) =>
      updateLesson(notebookId, lessonId, { title }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'lessons'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'index'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'lessons', variables.lessonId],
      });
    },
  });
}
