import type { NotebookIndex, LessonSummary } from '@/lib/types';

export type PageType = 'cover' | 'index' | 'lesson';

export interface PageSequenceEntry {
  globalPageNumber: number;
  url: string;
  type: PageType;
  lessonId?: string;
  pageId?: string;
  lessonTitle?: string;
  pageNumberInLesson?: number;
  totalPagesInLesson?: number;
}

/**
 * Builds a linear page sequence for a notebook.
 * Order: cover (0), index (1), then all lesson pages in order (2+).
 * Uses NotebookIndex for lesson ordering and LessonSummary[] for page counts.
 * Page IDs are not resolved here (resolved lazily via lesson detail).
 */
export function buildPageSequence(
  notebookId: string,
  index: NotebookIndex,
  lessons: LessonSummary[],
): PageSequenceEntry[] {
  const basePath = `/app/notebooks/${notebookId}`;
  const sequence: PageSequenceEntry[] = [];

  // Cover page — globalPageNumber 0
  sequence.push({
    globalPageNumber: 0,
    url: basePath,
    type: 'cover',
  });

  // Index page — globalPageNumber 1
  sequence.push({
    globalPageNumber: 1,
    url: `${basePath}/index`,
    type: 'index',
  });

  let globalPage = 2;

  // Build a lookup map from lessonId to LessonSummary for page counts
  const lessonMap = new Map<string, LessonSummary>();
  for (const lesson of lessons) {
    lessonMap.set(lesson.id, lesson);
  }

  // Iterate index entries in order (server returns lessons in creation order)
  for (const entry of index.entries) {
    const lesson = lessonMap.get(entry.lessonId);
    const pageCount = lesson?.pageCount ?? 0;

    for (let page = 1; page <= pageCount; page++) {
      sequence.push({
        globalPageNumber: globalPage,
        url: `${basePath}/lessons/${entry.lessonId}/pages/${page}`,
        type: 'lesson',
        lessonId: entry.lessonId,
        lessonTitle: entry.title,
        pageNumberInLesson: page,
        totalPagesInLesson: pageCount,
      });
      globalPage++;
    }
  }

  return sequence;
}
