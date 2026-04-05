import { useQuery } from '@tanstack/react-query';
import { getSystemPresets } from '@/api/presets';

export function useSystemPresets(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['presets'],
    queryFn: getSystemPresets,
    staleTime: 300_000,
    enabled: options?.enabled ?? false,
  });
}
