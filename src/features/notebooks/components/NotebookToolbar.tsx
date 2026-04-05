import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bookmark, Palette, Download, Trash2, Plus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/uiStore';
import { DeleteNotebookDialog } from './DeleteNotebookDialog';
import { useCreatePage } from '../hooks/useCreatePage';
import type { NotebookDetail } from '@/lib/types';

interface NotebookToolbarProps {
  notebook: NotebookDetail;
  globalPageNumber: number | null;
  currentPageType: 'cover' | 'index' | 'lesson';
  lessonId?: string;
}

export function NotebookToolbar({
  notebook,
  globalPageNumber,
  currentPageType,
  lessonId,
}: NotebookToolbarProps) {
  const { t } = useTranslation();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const createPageMutation = useCreatePage(notebook.id, lessonId ?? '');

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

        {/* Add Page button — visible only on lesson pages */}
        {currentPageType === 'lesson' && lessonId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createPageMutation.mutate()}
            disabled={createPageMutation.isPending}
          >
            <Plus className="mr-1 size-4" aria-hidden="true" />
            {t('notebooks.shell.page.addPage')}
          </Button>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom(zoom - 0.1)}
            aria-label={t('notebooks.shell.zoom.zoomOut')}
          >
            <ZoomOut className="size-4" aria-hidden="true" />
          </Button>
          <span className="min-w-[3.5ch] text-center text-xs tabular-nums text-muted-foreground">
            {t('notebooks.shell.zoom.percentage', { value: Math.round(zoom * 100) })}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom(zoom + 0.1)}
            aria-label={t('notebooks.shell.zoom.zoomIn')}
          >
            <ZoomIn className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom(1)}
            aria-label={t('notebooks.shell.zoom.resetZoom')}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
          </Button>
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
