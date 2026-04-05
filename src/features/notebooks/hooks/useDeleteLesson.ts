import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLesson } from '@/api/lessons';

export function useDeleteLesson(notebookId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (lessonId) => deleteLesson(notebookId, lessonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'lessons'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'index'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId],
        exact: true,
      });
    },
  });
}
