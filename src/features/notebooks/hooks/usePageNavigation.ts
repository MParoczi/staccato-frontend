import { useMemo } from 'react';
import { useParams, useLocation } from 'react-router';
import { useQueries } from '@tanstack/react-query';
import { getLesson } from '@/api/lessons';
import type { LessonPage } from '@/lib/types';
import { useNotebookIndex } from './useNotebookIndex';
import { useLessons } from './useLessons';
import { buildPageSequence } from '../utils/page-sequence';

export interface PageNavigationResult {
  prevUrl: string | null;
  nextUrl: string | null;
  globalPageNumber: number | null;
  currentPageType: 'cover' | 'index' | 'lesson';
  pageNumberInLesson?: number;
  totalPagesInLesson?: number;
}

export function usePageNavigation(notebookId: string): PageNavigationResult {
  const { lessonId, pageId } = useParams<{ lessonId: string; pageId: string }>();
  const location = useLocation();
  const indexQuery = useNotebookIndex(notebookId);
  const lessonsQuery = useLessons(notebookId);

  // Fetch every lesson's detail so that we know each lesson's real page ids
  // (the route uses real page ids; see `LessonPage`, `NotebookSidebar`).
  // Shares TanStack Query cache with `useLesson` hooks used elsewhere.
  const lessons = lessonsQuery.data;
  const lessonDetailQueries = useQueries({
    queries: (lessons ?? []).map((l) => ({
      queryKey: ['notebooks', notebookId, 'lessons', l.id] as const,
      queryFn: () => getLesson(notebookId, l.id),
      staleTime: 0,
    })),
  });

  // Determine current page type from route params and path
  const currentPageType: 'cover' | 'index' | 'lesson' = useMemo(() => {
    if (lessonId && pageId) return 'lesson';
    if (location.pathname.endsWith('/index')) return 'index';
    return 'cover';
  }, [lessonId, pageId, location.pathname]);

  // Build a stable snapshot of hydrated lesson pages keyed by lessonId.
  const lessonPagesEntries: Array<[string, LessonPage[]]> = [];
  for (const q of lessonDetailQueries) {
    if (q.data) lessonPagesEntries.push([q.data.id, q.data.pages]);
  }
  // Stable stringified key so the memo below only recomputes when the set of
  // hydrated lesson pages actually changes (not on every render).
  const lessonPagesKey = lessonPagesEntries
    .map(([id, pages]) => `${id}:${pages.map((p) => p.id).join(',')}`)
    .sort()
    .join('|');

  return useMemo(() => {
    const defaultResult: PageNavigationResult = {
      prevUrl: null,
      nextUrl: null,
      globalPageNumber: null,
      currentPageType,
    };

    if (!indexQuery.data || !lessons) {
      return defaultResult;
    }

    const lessonPages = new Map<string, LessonPage[]>(lessonPagesEntries);

    // Wait until every lesson's pages have been hydrated so that global page
    // numbers are correct and prev/next can cross lesson boundaries.
    const allHydrated = lessons.every((l) => lessonPages.has(l.id));
    if (!allHydrated) return defaultResult;

    const sequence = buildPageSequence(notebookId, indexQuery.data, lessonPages);
    if (sequence.length === 0) return defaultResult;

    // Find current page in sequence
    let currentIdx = -1;

    if (currentPageType === 'lesson' && lessonId && pageId) {
      currentIdx = sequence.findIndex(
        (entry) =>
          entry.type === 'lesson' &&
          entry.lessonId === lessonId &&
          entry.pageId === pageId,
      );
    } else if (currentPageType === 'index') {
      currentIdx = sequence.findIndex((entry) => entry.type === 'index');
    } else {
      currentIdx = 0;
    }

    if (currentIdx === -1) return defaultResult;

    const current = sequence[currentIdx];
    const prev = currentIdx > 0 ? sequence[currentIdx - 1] : null;
    const next = currentIdx < sequence.length - 1 ? sequence[currentIdx + 1] : null;

    return {
      prevUrl: prev?.url ?? null,
      nextUrl: next?.url ?? null,
      globalPageNumber: current.type === 'cover' ? null : current.globalPageNumber,
      currentPageType: current.type,
      pageNumberInLesson: current.pageNumberInLesson,
      totalPagesInLesson: current.totalPagesInLesson,
    };
    // `lessonPagesEntries` is derived from `lessonPagesKey`; depending on the
    // key keeps the memo stable across renders with unchanged data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPageType,
    indexQuery.data,
    lessons,
    notebookId,
    lessonId,
    pageId,
    lessonPagesKey,
  ]);
}
