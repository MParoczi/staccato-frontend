import { useQuery } from '@tanstack/react-query';
import { getInstruments } from '@/api/instruments';

export function useInstruments() {
  return useQuery({
    queryKey: ['instruments'],
    queryFn: getInstruments,
    staleTime: 300_000,
  });
}
