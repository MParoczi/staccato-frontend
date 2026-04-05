import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteLesson } from '../hooks/useDeleteLesson';
import type { LessonSummary } from '@/lib/types';

interface DeleteLessonDialogProps {
  lesson: LessonSummary;
  notebookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteLessonDialog({
  lesson,
  notebookId,
  open,
  onOpenChange,
  onDeleted,
}: DeleteLessonDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteLesson(notebookId);

  function handleConfirm() {
    deleteMutation.mutate(lesson.id, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => {
        toast.error(t('notebooks.shell.deleteLesson.error'));
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('notebooks.shell.deleteLesson.title', { title: lesson.title })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('notebooks.shell.deleteLesson.message')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('notebooks.shell.deleteLesson.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
