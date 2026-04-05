import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { DottedPaper } from '@/components/common/DottedPaper';
import { useNotebook } from '../hooks/useNotebook';
import { useLesson } from '../hooks/useLesson';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { useUIStore } from '@/stores/uiStore';

export function LessonPage() {
  const { notebookId, lessonId, pageId } = useParams<{
    notebookId: string;
    lessonId: string;
    pageId: string;
  }>();
  const { t } = useTranslation();
  const zoom = useUIStore((s) => s.zoom);

  const { data: notebook } = useNotebook(notebookId!);
  const { data: lesson } = useLesson(notebookId!, lessonId!);
  const pageNav = usePageNavigation(notebookId!);

  if (!notebook || !lesson) return null;

  // Find the page in the lesson's page list
  const page = lesson.pages.find((p) => p.id === pageId);

  // 404 handling — stale URL, page not found
  if (!page) {
    return (
      <DottedPaper
        pageSize={notebook.pageSize}
        zoom={zoom}
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
    <DottedPaper
      pageSize={notebook.pageSize}
      zoom={zoom}
      className="w-full max-w-lg rounded-sm shadow-lg"
    >
      <div className="flex h-full flex-col px-8 py-10">
        {/* Header: lesson title + in-lesson page indicator */}
        <div className="flex items-baseline justify-between gap-4">
          <h1
            className="min-w-0 truncate font-serif text-lg tracking-wide"
            style={{ color: 'var(--notebook-dot)' }}
          >
            {lesson.title}
          </h1>
          <span
            className="shrink-0 text-xs tabular-nums opacity-50"
          >
            {t('notebooks.shell.lesson.pageIndicator', {
              current: pageNav.pageNumberInLesson ?? page.pageNumber,
              total: pageNav.totalPagesInLesson ?? lesson.pages.length,
            })}
          </span>
        </div>

        {/* Canvas placeholder */}
        <div className="flex flex-1 items-center justify-center">
          <p className="max-w-xs text-center text-sm opacity-40">
            {t('notebooks.shell.lesson.canvasPlaceholder')}
          </p>
        </div>

        {/* Global page number */}
        {pageNav.globalPageNumber != null && (
          <div className="mt-4 text-right text-xs opacity-50">
            {t('notebooks.shell.index.pageNumber', {
              number: pageNav.globalPageNumber,
            })}
          </div>
        )}
      </div>
    </DottedPaper>
  );
}
