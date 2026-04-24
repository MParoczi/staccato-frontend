import { useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DottedPaper } from '@/components/common/DottedPaper';
import type { UpdateModuleLayoutInput } from '@/lib/types';
import { useNotebook } from '../hooks/useNotebook';
import { useLesson } from '../hooks/useLesson';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { useCreatePage } from '../hooks/useCreatePage';
import { usePageModules } from '../hooks/usePageModules';
import { useModuleLayoutMutations } from '../hooks/useModuleLayoutMutations';
import { DeletePageButton } from './DeletePageButton';
import { GridCanvas } from './GridCanvas';

export function LessonPage() {
  const { notebookId, lessonId, pageId } = useParams<{
    notebookId: string;
    lessonId: string;
    pageId: string;
  }>();
  const { t } = useTranslation();

  const { data: notebook } = useNotebook(notebookId!);
  const { data: lesson } = useLesson(notebookId!, lessonId!);
  const pageNav = usePageNavigation(notebookId!);
  const createPageMutation = useCreatePage(notebookId!, lessonId!);
  const { data: modules } = usePageModules(pageId);
  const { scheduleLayoutUpdate } = useModuleLayoutMutations({
    pageId: pageId ?? '',
  });

  const handleCommitLayout = useCallback(
    (moduleId: string, layout: UpdateModuleLayoutInput) => {
      if (!pageId) return;
      scheduleLayoutUpdate(moduleId, layout);
    },
    [pageId, scheduleLayoutUpdate],
  );

  if (!notebook || !lesson) return null;

  // Find the page in the lesson's page list
  const page = lesson.pages.find((p) => p.id === pageId);
  const isLastPage = lesson.pages.length === 1;

  // 404 handling — stale URL, page not found
  if (!page) {
    return (
      <DottedPaper
        pageSize={notebook.pageSize}
        className="w-full max-w-lg rounded-sm shadow-lg"
      >
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-10">
          <p className="text-sm opacity-70">
            {t('notebooks.shell.lesson.notFound')}
          </p>
          <Link
            to={`/app/notebooks/${notebookId}/index`}
            className="text-sm underline underline-offset-2 opacity-60 hover:opacity-80"
          >
            {t('notebooks.shell.lesson.backToIndex')}
          </Link>
        </div>
      </DottedPaper>
    );
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      {/* Header: lesson title + in-lesson page indicator */}
      <div className="flex items-baseline justify-between gap-4">
        <h1
          className="min-w-0 truncate font-serif text-lg tracking-wide"
          style={{ color: 'var(--notebook-dot)' }}
        >
          {lesson.title}
        </h1>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className="text-xs tabular-nums opacity-50"
            aria-live="polite"
          >
            {t('notebooks.shell.lesson.pageIndicator', {
              current: pageNav.pageNumberInLesson ?? page.pageNumber,
              total: pageNav.totalPagesInLesson ?? lesson.pages.length,
            })}
          </span>
          {/* Floating Add Page button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => createPageMutation.mutate()}
            disabled={createPageMutation.isPending}
            aria-label={t('notebooks.shell.page.addPage')}
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </Button>
          {/* Delete Page button */}
          <DeletePageButton
            notebookId={notebookId!}
            lessonId={lessonId!}
            pageId={pageId!}
            isLastPage={isLastPage}
          />
        </div>
      </div>

      {/* Canvas */}
      <GridCanvas
        pageSize={notebook.pageSize}
        modules={modules ?? []}
        styles={notebook.styles}
        onCommitLayout={handleCommitLayout}
      />

      {/* Global page number */}
      {pageNav.globalPageNumber != null && (
        <div className="text-right text-xs opacity-50">
          {t('notebooks.shell.index.pageNumber', {
            number: pageNav.globalPageNumber,
          })}
        </div>
      )}
    </div>
  );
}
