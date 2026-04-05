import { useMemo } from 'react';
import { useParams, useLocation } from 'react-router';
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

  // Determine current page type from route params and path
  const currentPageType: 'cover' | 'index' | 'lesson' = useMemo(() => {
    if (lessonId && pageId) return 'lesson';
    if (location.pathname.endsWith('/index')) return 'index';
    return 'cover';
  }, [lessonId, pageId, location.pathname]);

  return useMemo(() => {
    const defaultResult: PageNavigationResult = {
      prevUrl: null,
      nextUrl: null,
      globalPageNumber: null,
      currentPageType,
    };

    if (!indexQuery.data || !lessonsQuery.data) {
      return defaultResult;
    }

    const sequence = buildPageSequence(notebookId, indexQuery.data, lessonsQuery.data);
    if (sequence.length === 0) return defaultResult;

    // Find current page in sequence
    let currentIdx = -1;

    if (currentPageType === 'lesson' && lessonId && pageId) {
      currentIdx = sequence.findIndex(
        (entry) =>
          entry.type === 'lesson' &&
          entry.lessonId === lessonId &&
          entry.url.endsWith(`/pages/${pageId}`),
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
  }, [currentPageType, indexQuery.data, lessonsQuery.data, notebookId, lessonId, pageId]);
}
