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

export interface DeleteBlockDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onConfirm: () => void;
}

/**
 * Confirm dialog for deleting a non-empty block (UI-SPEC §4.7). Cancel is
 * default-focused (Radix `AlertDialogCancel` autofocuses by default).
 * Confirm uses destructive variant via Tailwind classes.
 */
export function DeleteBlockDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteBlockDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('editor.deleteBlockTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('editor.deleteBlockDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {t('editor.deleteBlockConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

