import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bookmark, Palette, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/uiStore';
import { DeleteNotebookDialog } from './DeleteNotebookDialog';
import type { NotebookDetail } from '@/lib/types';

interface NotebookToolbarProps {
  notebook: NotebookDetail;
  globalPageNumber: number | null;
}

export function NotebookToolbar({ notebook, globalPageNumber }: NotebookToolbarProps) {
  const { t } = useTranslation();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex h-10 items-center gap-2 border-b bg-muted/40 px-3">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/app/notebooks"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('notebooks.dashboard.title')}
          </Link>
          <span className="text-muted-foreground">&gt;</span>
          <span className="truncate font-medium">{notebook.title}</span>
        </nav>

        {/* Sidebar toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={t('notebooks.shell.toolbar.toggleSidebar')}
        >
          <Bookmark className="size-4" aria-hidden="true" />
        </Button>

        {/* Zoom controls placeholder */}
        <div className="flex items-center gap-1">
          {/* Zoom buttons added in Phase 8 */}
        </div>

        <div className="flex-1" />

        {/* Page indicator */}
        {globalPageNumber !== null && (
          <Badge variant="secondary" className="tabular-nums">
            {globalPageNumber}
          </Badge>
        )}

        {/* Style Editor button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toast.info(t('notebooks.shell.toolbar.comingSoon'))}
          aria-label={t('notebooks.shell.toolbar.styleEditor')}
        >
          <Palette className="size-4" aria-hidden="true" />
        </Button>

        {/* Export button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toast.info(t('notebooks.shell.toolbar.comingSoon'))}
          aria-label={t('notebooks.shell.toolbar.export')}
        >
          <Download className="size-4" aria-hidden="true" />
        </Button>

        {/* Delete notebook button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setDeleteOpen(true)}
          aria-label={t('notebooks.shell.toolbar.delete')}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <DeleteNotebookDialog
        notebook={notebook}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
