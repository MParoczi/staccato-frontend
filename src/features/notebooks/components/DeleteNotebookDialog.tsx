import { useTranslation } from 'react-i18next';
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
import { useDeleteNotebook } from '../hooks/useDeleteNotebook';
import type { NotebookSummary } from '@/lib/types';

interface DeleteNotebookDialogProps {
  notebook: NotebookSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteNotebookDialog({
  notebook,
  open,
  onOpenChange,
}: DeleteNotebookDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteNotebook();

  function handleConfirm() {
    if (!notebook) return;
    deleteMutation.mutate(notebook.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('notebooks.delete.title', { title: notebook?.title ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('notebooks.delete.message')}
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
            {t('notebooks.delete.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
