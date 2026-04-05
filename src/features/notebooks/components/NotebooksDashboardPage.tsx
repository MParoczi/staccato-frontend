import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotebooks } from '../hooks/useNotebooks';
import { NotebookCard } from './NotebookCard';
import { NotebookCardSkeleton } from './NotebookCardSkeleton';
import { EmptyState } from './EmptyState';
import { SortControl, type SortOption } from './SortControl';
import { CreateNotebookDialog } from './CreateNotebookDialog';
import type { NotebookSummary } from '@/lib/types';

function sortNotebooks(
  notebooks: NotebookSummary[],
  sortBy: SortOption,
): NotebookSummary[] {
  return [...notebooks].sort((a, b) => {
    switch (sortBy) {
      case 'updatedAt':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
}

export function NotebooksDashboardPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: notebooks, isLoading, isError, refetch } = useNotebooks();

  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(
    () => location.pathname === '/app/notebooks/new',
  );

  const sortedNotebooks = useMemo(
    () => (notebooks ? sortNotebooks(notebooks, sortBy) : []),
    [notebooks, sortBy],
  );

  const dialogOpen = isCreateDialogOpen || location.pathname === '/app/notebooks/new';

  function handleCreateClick() {
    setIsCreateDialogOpen(true);
    navigate('/app/notebooks/new');
  }

  function handleDialogOpenChange(open: boolean) {
    setIsCreateDialogOpen(open);
    if (!open && location.pathname === '/app/notebooks/new') {
      navigate('/app/notebooks');
    }
  }

  function handleDeleteRequest(_notebook: NotebookSummary) {
    // Delete dialog integration completed in Phase 5
    void _notebook;
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {t('notebooks.dashboard.title')}
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <NotebookCardSkeleton key={i} />
          ))}
        </div>
        <CreateNotebookDialog open={dialogOpen} onOpenChange={handleDialogOpenChange} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 py-24 text-center">
        <AlertTriangle className="mb-4 size-12 text-destructive" />
        <p className="mb-4 text-sm text-muted-foreground">
          {t('common.error')}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          {t('common.errorBoundary.retry')}
        </Button>
        <CreateNotebookDialog open={dialogOpen} onOpenChange={handleDialogOpenChange} />
      </div>
    );
  }

  if (!notebooks || notebooks.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {t('notebooks.dashboard.title')}
          </h1>
        </div>
        <EmptyState onCreate={handleCreateClick} />
        <CreateNotebookDialog open={dialogOpen} onOpenChange={handleDialogOpenChange} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {t('notebooks.dashboard.title')}
        </h1>
        <div className="flex items-center gap-3">
          <SortControl value={sortBy} onChange={setSortBy} />
          <Button onClick={handleCreateClick}>
            <Plus className="size-4" />
            {t('notebooks.dashboard.createButton')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedNotebooks.map((notebook) => (
          <NotebookCard
            key={notebook.id}
            notebook={notebook}
            onDelete={handleDeleteRequest}
          />
        ))}

        <button
          type="button"
          className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
          onClick={handleCreateClick}
        >
          <Plus className="size-8" />
          <span className="text-sm font-medium">
            {t('notebooks.dashboard.addCard')}
          </span>
        </button>
      </div>

      <CreateNotebookDialog open={dialogOpen} onOpenChange={handleDialogOpenChange} />
    </div>
  );
}
