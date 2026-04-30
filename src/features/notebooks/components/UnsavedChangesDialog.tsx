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
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UnsavedChangesDialogProps {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

/**
 * Dirty-state navigation guard dialog (UI-SPEC §4.11).
 *
 * Reuses the shadcn `AlertDialog` primitive. Cancel ("Keep editing") is
 * default-focused per UI-SPEC; the destructive "Discard changes" action
 * uses the destructive button variant.
 *
 * The dialog is *controlled* by the host: open is a boolean, callbacks
 * are invoked when the user presses one of the two terminal actions.
 */
export function UnsavedChangesDialog({
  open,
  onKeepEditing,
  onDiscard,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('editor.unsavedTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('editor.unsavedDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onKeepEditing}>
            {t('editor.unsavedKeepEditing')}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: 'destructive' }))}
            onClick={onDiscard}
          >
            {t('editor.unsavedDiscard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

