import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownToLine, ArrowUpToLine, Ellipsis, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { Module } from '@/lib/types';
import { isOnBottom, isOnTop } from '@/features/notebooks/utils/z-index';

interface ModuleContextMenuProps {
  /** The currently selected module the menu acts on. */
  module: Module;
  /** All modules on the page; needed to disable layering at edges. */
  modules: readonly Module[];
  /** Bring-to-front trigger handled by the lesson page. */
  onBringToFront: (moduleId: string) => void;
  /** Send-to-back trigger handled by the lesson page. */
  onSendToBack: (moduleId: string) => void;
  /** Delete trigger handled by the lesson page after confirmation. */
  onDelete: (moduleId: string) => void;
}

/**
 * Selected-module action menu offering layering and delete entries.
 *
 * Empty modules (no `content` blocks) delete immediately to match the
 * spec; modules with content require the user to confirm via an
 * `AlertDialog`. Layering entries route through `bringToFront` and
 * `sendToBack` so visual order changes do not bypass the no-overlap
 * placement rules.
 */
export function ModuleContextMenu({
  module,
  modules,
  onBringToFront,
  onSendToBack,
  onDelete,
}: ModuleContextMenuProps) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onTop = isOnTop(modules, module.id);
  const onBottom = isOnBottom(modules, module.id);
  const isEmpty = module.content.length === 0;

  const handleDeleteClick = useCallback(() => {
    if (isEmpty) {
      onDelete(module.id);
      return;
    }
    setConfirmOpen(true);
  }, [isEmpty, module.id, onDelete]);

  const handleConfirmDelete = useCallback(() => {
    setConfirmOpen(false);
    onDelete(module.id);
  }, [module.id, onDelete]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('notebooks.canvas.menu.open')}
            data-testid="module-context-menu-trigger"
          >
            <Ellipsis className="size-3.5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => onBringToFront(module.id)}
            disabled={onTop}
            data-testid="module-context-menu-bring-to-front"
          >
            <ArrowUpToLine className="size-4" aria-hidden="true" />
            <span>{t('notebooks.canvas.menu.bringToFront')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onSendToBack(module.id)}
            disabled={onBottom}
            data-testid="module-context-menu-send-to-back"
          >
            <ArrowDownToLine className="size-4" aria-hidden="true" />
            <span>{t('notebooks.canvas.menu.sendToBack')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleDeleteClick}
            data-testid="module-context-menu-delete"
            variant="destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span>{t('notebooks.canvas.menu.delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('notebooks.canvas.menu.confirmDeleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('notebooks.canvas.menu.confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="module-context-menu-cancel">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              data-testid="module-context-menu-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
