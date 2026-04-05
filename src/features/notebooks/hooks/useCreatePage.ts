import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createPage } from '@/api/pages';
import type { LessonPageWithWarning } from '@/lib/types';

export function useCreatePage(notebookId: string, lessonId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return useMutation<LessonPageWithWarning, Error, void>({
    mutationFn: () => createPage(lessonId),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'lessons', lessonId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'lessons', lessonId, 'pages'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'index'],
      });

      if (data.warning) {
        toast.warning(data.warning);
      }

      void navigate(
        `/app/notebooks/${notebookId}/lessons/${lessonId}/pages/${data.page.id}`,
      );
    },
    onError: () => {
      toast.error(t('notebooks.shell.page.createError'));
    },
  });
}
