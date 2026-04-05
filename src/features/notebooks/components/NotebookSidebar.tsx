import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LessonSidebarEntry } from './LessonSidebarEntry';
import { CreateLessonDialog } from './CreateLessonDialog';
import { useLesson } from '../hooks/useLesson';
import type { NotebookDetail, LessonSummary } from '@/lib/types';

interface NotebookSidebarProps {
  notebook: NotebookDetail;
  lessons: LessonSummary[];
  isLoading: boolean;
}

export function NotebookSidebar({
  notebook,
  lessons,
  isLoading,
}: NotebookSidebarProps) {
  const { t } = useTranslation();
  const { lessonId } = useParams<{ lessonId: string }>();
  const [createOpen, setCreateOpen] = useState(false);

  // Sort lessons by createdAt ascending (FR-022)
  const sortedLessons = [...lessons].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Lesson list */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1 px-3 py-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : sortedLessons.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('notebooks.shell.sidebar.empty')}
              </p>
            </div>
          ) : (
            sortedLessons.map((lesson) => (
              <LessonSidebarEntryWithNavigation
                key={lesson.id}
                lesson={lesson}
                notebookId={notebook.id}
                isActive={lesson.id === lessonId}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add Lesson button */}
      <div className="border-t border-border/40 p-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-2 size-4" />
          {t('notebooks.shell.sidebar.addLesson')}
        </Button>
      </div>

      <CreateLessonDialog
        notebookId={notebook.id}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}

/**
 * Wrapper that fetches lesson detail for navigation (to get first page ID).
 */
function LessonSidebarEntryWithNavigation({
  lesson,
  notebookId,
  isActive,
}: {
  lesson: LessonSummary;
  notebookId: string;
  isActive: boolean;
}) {
  const navigate = useNavigate();
  const lessonQuery = useLesson(notebookId, lesson.id);

  function handleNavigate() {
    if (lessonQuery.data && lessonQuery.data.pages.length > 0) {
      void navigate(
        `/app/notebooks/${notebookId}/lessons/${lesson.id}/pages/${lessonQuery.data.pages[0].id}`,
      );
    }
  }

  return (
    <LessonSidebarEntry
      lesson={lesson}
      notebookId={notebookId}
      isActive={isActive}
      onNavigate={handleNavigate}
    />
  );
}
