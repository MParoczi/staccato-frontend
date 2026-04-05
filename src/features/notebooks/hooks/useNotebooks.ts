import { useQuery } from '@tanstack/react-query';
import { getNotebooks } from '@/api/notebooks';

export function useNotebooks() {
  return useQuery({
    queryKey: ['notebooks'],
    queryFn: getNotebooks,
    staleTime: 0,
  });
}
