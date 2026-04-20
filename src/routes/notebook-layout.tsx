import { useEffect } from 'react';
import { Outlet, useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useUIStore } from '@/stores/uiStore';
import { useNotebook } from '@/features/notebooks/hooks/useNotebook';
import { useLessons } from '@/features/notebooks/hooks/useLessons';
import { usePageNavigation } from '@/features/notebooks/hooks/usePageNavigation';
import { useKeyboardNavigation } from '@/features/notebooks/hooks/useKeyboardNavigation';
import { NotebookToolbar } from '@/features/notebooks/components/NotebookToolbar';
import { PageNavigationArrows } from '@/features/notebooks/components/PageNavigationArrows';
import { NotebookSidebar } from '@/features/notebooks/components/NotebookSidebar';

export function NotebookLayout() {
  const { t } = useTranslation();
  const { notebookId } = useParams<{ notebookId: string }>();
  const { lessonId } = useParams<{ lessonId: string }>();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);

  // Reset zoom and sidebar on notebookId change (FR-013)
  useEffect(() => {
    setZoom(1.0);
    setSidebarOpen(false);
  }, [notebookId, setZoom, setSidebarOpen]);

  const notebookQuery = useNotebook(notebookId!);
  const lessonsQuery = useLessons(notebookId!);
  const pageNav = usePageNavigation(notebookId!);

  // Keyboard navigation
  useKeyboardNavigation(pageNav.prevUrl, pageNav.nextUrl);

  // Loading state
  if (notebookQuery.isPending || lessonsQuery.isPending) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex h-10 items-center gap-2 border-b bg-muted/40 px-3">
          <Skeleton className="h-4 w-48" />
          <div className="flex-1" />
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-6" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-[60vh] w-[45vh]" />
        </div>
      </div>
    );
  }

  // Error state
  if (notebookQuery.isError || lessonsQuery.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-destructive">
          {t('common.error')}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              void notebookQuery.refetch();
              void lessonsQuery.refetch();
            }}
          >
            {t('common.errorBoundary.retry')}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/notebooks">{t('common.goBack')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const notebook = notebookQuery.data;

  return (
    <div className="flex flex-1 flex-col">
      {/* Toolbar */}
      <NotebookToolbar
        notebook={notebook}
        globalPageNumber={pageNav.globalPageNumber}
        currentPageType={pageNav.currentPageType}
        lessonId={lessonId}
      />

      {/* Canvas area */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-clip">
        {/* Notebook sidebar sheet — non-modal + non-portaled so it stays inside
            NotebookLayout's DOM subtree (LC-8) and cannot trap focus away from
            the app sidebar (FR-023). Uses absolute positioning so the sheet
            aligns to the left edge of <main>, not the viewport. */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen} modal={false}>
          <SheetContent side="left" showCloseButton portal={false} className="absolute">
            <SheetHeader>
              <SheetTitle>{notebook.title}</SheetTitle>
              <SheetDescription className="sr-only">
                {t('notebooks.shell.toolbar.toggleSidebar')}
              </SheetDescription>
            </SheetHeader>
            <NotebookSidebar
              notebook={notebook}
              lessons={lessonsQuery.data ?? []}
              isLoading={lessonsQuery.isPending}
            />
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-start justify-center overflow-auto p-4">
          <div className="w-full" style={{ zoom }}>
            <Outlet />
          </div>
        </div>
        <PageNavigationArrows
          prevUrl={pageNav.prevUrl}
          nextUrl={pageNav.nextUrl}
        />
      </div>
    </div>
  );
}
