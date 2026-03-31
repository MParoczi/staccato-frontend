import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxiosError } from 'axios';

export function useRateLimitError() {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLimited = secondsRemaining > 0;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleError = useCallback((error: AxiosError): boolean => {
    if (error.response?.status !== 429) return false;

    const retryAfter = parseInt(
      error.response.headers['retry-after'] as string,
      10,
    );
    const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;

    setSecondsRemaining(seconds);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return true;
  }, []);

  return { isLimited, secondsRemaining, handleError };
}
