import { describe, it, expect } from 'vitest';
import type { AxiosError } from 'axios';
import { shouldRetryQuery } from './query-client';

function axiosErrorWithStatus(status: number): AxiosError {
  return {
    isAxiosError: true,
    response: { status, statusText: '', data: null, headers: {}, config: {} },
  } as unknown as AxiosError;
}

describe('shouldRetryQuery', () => {
  it('does not retry 401 responses', () => {
    expect(shouldRetryQuery(0, axiosErrorWithStatus(401))).toBe(false);
  });

  it('does not retry 403 responses', () => {
    expect(shouldRetryQuery(0, axiosErrorWithStatus(403))).toBe(false);
  });

  it('does not retry 404 responses', () => {
    expect(shouldRetryQuery(0, axiosErrorWithStatus(404))).toBe(false);
  });

  it('does not retry 422 responses', () => {
    expect(shouldRetryQuery(0, axiosErrorWithStatus(422))).toBe(false);
  });

  it('retries 500 responses up to 3 times', () => {
    const err = axiosErrorWithStatus(500);
    expect(shouldRetryQuery(0, err)).toBe(true);
    expect(shouldRetryQuery(1, err)).toBe(true);
    expect(shouldRetryQuery(2, err)).toBe(true);
    expect(shouldRetryQuery(3, err)).toBe(false);
  });

  it('retries 503 responses', () => {
    expect(shouldRetryQuery(0, axiosErrorWithStatus(503))).toBe(true);
  });

  it('retries network errors (no response) up to 3 times', () => {
    const networkError = { isAxiosError: true } as unknown as AxiosError;
    expect(shouldRetryQuery(0, networkError)).toBe(true);
    expect(shouldRetryQuery(2, networkError)).toBe(true);
    expect(shouldRetryQuery(3, networkError)).toBe(false);
  });

  it('treats unknown/non-axios errors as network errors and retries', () => {
    expect(shouldRetryQuery(0, new Error('boom'))).toBe(true);
    expect(shouldRetryQuery(3, new Error('boom'))).toBe(false);
  });
});
