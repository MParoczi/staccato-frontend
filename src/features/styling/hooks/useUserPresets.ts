import { useQuery } from '@tanstack/react-query';
import { getUserPresets } from '@/api/presets';

/**
 * Fetches the current user's saved style presets.
 *
 * - Query key: `['user', 'presets']`.
 * - `staleTime: 0` so mutations (create/rename/delete) immediately trigger a
 *   refetch on next focus/invalidation.
 * - The response from `GET /users/me/presets` is newest-first; this hook
 *   preserves that server-provided order and never applies a client-side
 *   sort heuristic.
 */
export function useUserPresets(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['user', 'presets'] as const,
    queryFn: getUserPresets,
    staleTime: 0,
    enabled: options?.enabled ?? true,
  });
}
