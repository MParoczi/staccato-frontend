import type { NotebookIndex, LessonPage } from '@/lib/types';

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
 * Uses `NotebookIndex` for lesson ordering and a per-lesson page map for
 * the real page ids. Lesson pages are sorted by `pageNumber` ascending and
 * emit `/pages/${pageId}` URLs using the real page id (not the 1-based
 * in-lesson index), so the sequence matches the routes resolved by
 * `LessonPage` and produced by `NotebookSidebar`.
 *
 * Lessons whose pages are not present in `lessonPages` are skipped: callers
 * (e.g. `usePageNavigation`) are expected to wait until every lesson's pages
 * have been hydrated before relying on the sequence for prev/next.
 */
export function buildPageSequence(
  notebookId: string,
  index: NotebookIndex,
  lessonPages: ReadonlyMap<string, readonly LessonPage[]>,
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

  // Iterate index entries in order (server returns lessons in creation order)
  for (const entry of index.entries) {
    const pages = lessonPages.get(entry.lessonId);
    if (!pages || pages.length === 0) continue;

    const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
    const total = sortedPages.length;

    for (let i = 0; i < sortedPages.length; i++) {
      const page = sortedPages[i];
      sequence.push({
        globalPageNumber: globalPage,
        url: `${basePath}/lessons/${entry.lessonId}/pages/${page.id}`,
        type: 'lesson',
        lessonId: entry.lessonId,
        pageId: page.id,
        lessonTitle: entry.title,
        pageNumberInLesson: i + 1,
        totalPagesInLesson: total,
      });
      globalPage++;
    }
  }

  return sequence;
}
