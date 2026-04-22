import { useQuery } from '@tanstack/react-query';
import { getNotebookStyles } from '@/api/notebooks';

/**
 * Fetches all 12 module styles for a notebook.
 *
 * - Uses the hierarchical query key `['notebooks', notebookId, 'styles']`.
 * - `staleTime: 0` so saves/applies always trigger a fresh refetch on focus.
 * - Refetches when the window regains focus per the notebook styles contract.
 * - The backend guarantees exactly 12 provisioned records; the frontend does
 *   not synthesize fallbacks.
 */
export function useNotebookStyles(
  notebookId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['notebooks', notebookId, 'styles'] as const,
    queryFn: () => getNotebookStyles(notebookId as string),
    enabled: Boolean(notebookId) && (options?.enabled ?? true),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
