import { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 300_000,
      retry: (failureCount, error) => {
        const axiosError = error as AxiosError;
        if (axiosError?.response?.status === 401) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: true,
    },
  },
});
