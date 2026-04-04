import { useQuery } from '@tanstack/react-query';
import { getUserPresets } from '@/api/presets';

export function useUserPresets() {
  return useQuery({
    queryKey: ['user', 'presets'],
    queryFn: getUserPresets,
  });
}
