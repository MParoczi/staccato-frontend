import { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

const MAX_RETRIES = 3;

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  const status = (error as AxiosError | undefined)?.response?.status;
  // Network error (no response) — retry.
  if (status === undefined) return true;
  // Retry only on server errors (5xx). Do not retry any 4xx client errors.
  return status >= 500 && status < 600;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 300_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: true,
    },
  },
});
