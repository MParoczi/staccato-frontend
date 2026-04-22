import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotebookStyles } from '../hooks/useNotebookStyles';
import { StyleEditorForm } from './StyleEditorForm';

interface StyleEditorDrawerProps {
  notebookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Desktop Sheet drawer (~480 px) that loads 12 notebook styles and hosts the
 * style editor form. The form is rendered only once data is available so
 * every field receives a defined initial value on first render.
 *
 * Closing the drawer discards any unsaved edits (no confirmation prompt).
 */
export function StyleEditorDrawer({
  notebookId,
  open,
  onOpenChange,
}: StyleEditorDrawerProps) {
  const { t } = useTranslation();
  const stylesQuery = useNotebookStyles(notebookId, { enabled: open });
  const closeResetRef = useRef<(() => void) | null>(null);
  const registerCloseReset = useCallback((handler: () => void) => {
    closeResetRef.current = handler;
  }, []);

  const isLoading = stylesQuery.isPending;
  const styles = stylesQuery.data;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Close-discard: reset the form to the server values. Skip when the
      // form never mounted (styles still loading) so we don't run the reset
      // handler against stale/undefined styles.
      if (styles !== undefined && closeResetRef.current) {
        closeResetRef.current();
      }
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
        data-slot="style-editor-drawer"
      >
        <SheetHeader className="border-b">
          <SheetTitle>{t('styling.drawer.title')}</SheetTitle>
          <SheetDescription>
            {t('styling.drawer.description')}
          </SheetDescription>
        </SheetHeader>

        {isLoading || !styles ? (
          <div
            data-slot="style-editor-loading"
            className="flex flex-1 flex-col gap-3 overflow-hidden p-4"
          >
            <Skeleton
              className="h-6 w-full"
              aria-label={t('styling.drawer.loading')}
            />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        ) : (
          <StyleEditorForm
            notebookId={notebookId}
            styles={styles}
            serverKey={stylesQuery.dataUpdatedAt}
            registerCloseReset={registerCloseReset}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
