import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { DottedPaper } from '@/components/common/DottedPaper';
import { useNotebook } from '../hooks/useNotebook';
import { useNotebookIndex } from '../hooks/useNotebookIndex';
import { useUIStore } from '@/stores/uiStore';
import { getLesson } from '@/api/lessons';
import type { NotebookIndexEntry } from '@/lib/types';

export function IndexPage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const { data: notebook } = useNotebook(notebookId!);
  const { data: index } = useNotebookIndex(notebookId!);

  const [navigatingLessonId, setNavigatingLessonId] = useState<string | null>(null);

  const handleEntryClick = useCallback(
    async (entry: NotebookIndexEntry) => {
      if (navigatingLessonId) return;
      setNavigatingLessonId(entry.lessonId);
      try {
        const lessonDetail = await queryClient.fetchQuery({
          queryKey: ['notebooks', notebookId!, 'lessons', entry.lessonId],
          queryFn: () => getLesson(notebookId!, entry.lessonId),
          staleTime: 0,
        });
        if (lessonDetail.pages.length > 0) {
          navigate(
            `/app/notebooks/${notebookId}/lessons/${entry.lessonId}/pages/${lessonDetail.pages[0].id}`,
          );
        }
      } finally {
        setNavigatingLessonId(null);
      }
    },
    [navigatingLessonId, notebookId, queryClient, navigate],
  );

  if (!notebook || !index) return null;

  const entries = index.entries;
  const hasEntries = entries.length > 0;

  return (
    <DottedPaper
      pageSize={notebook.pageSize}
      className="w-full max-w-lg rounded-sm shadow-lg"
    >
      <div className="flex h-full flex-col px-8 py-10">
        {/* INDEX heading */}
        <h1 className="mb-8 text-center font-serif text-2xl tracking-widest"
          style={{ color: 'var(--notebook-dot)' }}
        >
          {t('notebooks.shell.index.heading')}
        </h1>

        {/* TOC entries or empty state */}
        {hasEntries ? (
          <ol className="flex flex-col gap-2">
            {entries.map((entry, idx) => (
              <li key={entry.lessonId}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-baseline gap-2 text-left text-sm disabled:opacity-50"
                  style={{ color: 'var(--foreground)' }}
                  disabled={navigatingLessonId === entry.lessonId}
                  onClick={() => void handleEntryClick(entry)}
                >
                  {/* Sequential number */}
                  <span className="shrink-0 tabular-nums">{idx + 1}.</span>

                  {/* Lesson title (truncated) */}
                  <span className="min-w-0 truncate">{entry.title}</span>

                  {/* Dotted leader line */}
                  <span
                    className="mx-1 min-w-4 flex-1 self-end border-b border-dotted"
                    style={{ borderColor: 'var(--notebook-dot)' }}
                    aria-hidden="true"
                  />

                  {/* Starting page number */}
                  <span className="shrink-0 tabular-nums">
                    {entry.startPageNumber}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="max-w-xs text-center text-sm opacity-60">
              <p>{t('notebooks.shell.index.emptyMessage')}</p>
              <button
                type="button"
                className="mt-2 cursor-pointer underline underline-offset-2"
                onClick={() => setSidebarOpen(true)}
              >
                {t('notebooks.shell.index.emptyAction')}
              </button>
            </div>
          </div>
        )}

        {/* Spacer to push page number to bottom */}
        <div className="flex-1" />

        {/* Global page number */}
        <div className="mt-4 text-right text-xs opacity-50">
          {t('notebooks.shell.index.pageNumber', { number: 1 })}
        </div>
      </div>
    </DottedPaper>
  );
}
