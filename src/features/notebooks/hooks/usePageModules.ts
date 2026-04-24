import { useQuery } from '@tanstack/react-query';
import { getModules } from '@/api/modules';
import type { Module } from '@/lib/types';

/**
 * Build the canonical query key for a page's modules. Always use this helper
 * when reading or mutating the cache so optimistic updates and invalidations
 * stay aligned across hooks.
 */
export function pageModulesQueryKey(
  pageId: string,
): readonly ['pages', string, 'modules'] {
  return ['pages', pageId, 'modules'] as const;
}

/**
 * Load the modules for a lesson page.
 *
 * Cache key follows the documented `['pages', pageId, 'modules']` pattern.
 * `staleTime` is `0` per `data-model.md` so create/move/resize/delete/layer
 * actions consistently see the latest server snapshot, while focus refetch
 * keeps long-lived editor tabs in sync with backend changes.
 *
 * Returns an empty data array until `pageId` is provided to keep callers
 * (e.g. router-driven `LessonPage`) from rendering against `undefined`
 * during transition states.
 */
export function usePageModules(pageId: string | undefined) {
  return useQuery<Module[]>({
    queryKey: pageModulesQueryKey(pageId ?? ''),
    queryFn: () => getModules(pageId as string),
    enabled: Boolean(pageId),
    staleTime: 0,
  });
}
