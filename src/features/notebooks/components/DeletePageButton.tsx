import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { useDeletePage } from '../hooks/useDeletePage';

interface DeletePageButtonProps {
  notebookId: string;
  lessonId: string;
  pageId: string;
  isLastPage: boolean;
  onDeleted?: () => void;
}

export function DeletePageButton({
  notebookId,
  lessonId,
  pageId,
  isLastPage,
  onDeleted,
}: DeletePageButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeletePage(notebookId, lessonId);

  function handleClick() {
    if (isLastPage) {
      toast.error(t('notebooks.shell.page.lastPageError'));
      return;
    }
    setOpen(true);
  }

  function handleConfirm() {
    deleteMutation.mutate(pageId, {
      onSuccess: () => {
        setOpen(false);
        onDeleted?.();
      },
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleClick}
        aria-label={t('common.delete')}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('notebooks.shell.page.deleteConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('notebooks.shell.page.deleteConfirmMessage')}
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
              {t('notebooks.shell.page.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
