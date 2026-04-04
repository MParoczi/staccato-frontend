import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/api/users';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: getMe,
    staleTime: 30_000,
  });
}
