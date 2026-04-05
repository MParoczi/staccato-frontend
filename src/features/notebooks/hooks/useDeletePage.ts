import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { deletePage } from '@/api/pages';
import { useLesson } from './useLesson';
import type { BusinessErrorResponse } from '@/lib/types';

export function useDeletePage(notebookId: string, lessonId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: lesson } = useLesson(notebookId, lessonId);

  return useMutation<void, Error, string>({
    mutationFn: (pageId) => deletePage(lessonId, pageId),
    onSuccess: (_data, pageId) => {
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'lessons', lessonId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'lessons', lessonId, 'pages'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'index'],
      });

      // Navigate to previous page (or next if deleting page 1)
      if (lesson) {
        const pages = lesson.pages;
        const deletedIndex = pages.findIndex((p) => p.id === pageId);

        let targetPage;
        if (deletedIndex > 0) {
          targetPage = pages[deletedIndex - 1];
        } else if (pages.length > 1) {
          targetPage = pages[deletedIndex + 1];
        }

        if (targetPage) {
          void navigate(
            `/app/notebooks/${notebookId}/lessons/${lessonId}/pages/${targetPage.id}`,
          );
        }
      }
    },
    onError: (error) => {
      const axiosError = error as AxiosError<BusinessErrorResponse>;
      if (
        axiosError.response?.status === 422 &&
        axiosError.response.data?.code === 'LAST_PAGE_DELETION'
      ) {
        toast.error(t('notebooks.shell.page.lastPageError'));
      } else {
        toast.error(t('notebooks.shell.page.deleteError'));
      }
    },
  });
}
