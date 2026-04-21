import { useQuery } from '@tanstack/react-query';
import { getSystemPresets } from '@/api/presets';

/**
 * Fetches the 5 system-provided style presets.
 *
 * - Query key: `['presets']`.
 * - `staleTime: 300_000` (5 minutes) — system presets are low-churn reference
 *   data and do not need to be refetched during an open editor session.
 */
export function useSystemPresets(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['presets'] as const,
    queryFn: getSystemPresets,
    staleTime: 300_000,
    enabled: options?.enabled ?? true,
  });
}
