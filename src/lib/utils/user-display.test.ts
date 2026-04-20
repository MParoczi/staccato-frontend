import { describe, it, expect } from 'vitest';
import { computeUserDisplayProjection } from './user-display';
import type { User } from '@/lib/types/auth';

const FALLBACK = 'Account';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u-1',
    email: 'ada@x.y',
    firstName: '',
    lastName: '',
    language: 'en',
    defaultPageSize: null,
    defaultInstrumentId: null,
    avatarUrl: null,
    scheduledDeletionAt: null,
    ...overrides,
  };
}

describe('computeUserDisplayProjection', () => {
  it('UD-1: returns tier 4 when isLoading is true', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: 'Ada', lastName: 'Lovelace' }),
      isLoading: true,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 4,
      displayName: FALLBACK,
      avatarFallback: 'icon',
    });
  });

  it('UD-2: returns tier 4 when isError is true', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: 'Ada', lastName: 'Lovelace' }),
      isLoading: false,
      isError: true,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 4,
      displayName: FALLBACK,
      avatarFallback: 'icon',
    });
  });

  it('UD-3: returns tier 4 when user is null', () => {
    const result = computeUserDisplayProjection({
      user: null,
      isLoading: false,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 4,
      displayName: FALLBACK,
      avatarFallback: 'icon',
    });
  });

  it('UD-4: returns tier 4 when user is undefined', () => {
    const result = computeUserDisplayProjection({
      user: undefined,
      isLoading: false,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 4,
      displayName: FALLBACK,
      avatarFallback: 'icon',
    });
  });

  it('UD-5: returns tier 1 when both firstName and lastName are present', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.y' }),
      isLoading: false,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 1,
      displayName: 'Ada Lovelace',
      avatarFallback: 'AL',
    });
  });

  it('UD-6: returns tier 2 when only firstName is present', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: 'Ada', lastName: '', email: 'ada@x.y' }),
      isLoading: false,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 2,
      displayName: 'Ada',
      avatarFallback: 'A',
    });
  });

  it('UD-7: returns tier 2 when only lastName is present', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: '', lastName: 'Lovelace', email: 'ada@x.y' }),
      isLoading: false,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 2,
      displayName: 'Lovelace',
      avatarFallback: 'L',
    });
  });

  it('UD-8: treats whitespace-only firstName as empty (tier 2 with lastName)', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: '  ', lastName: 'Lovelace', email: 'ada@x.y' }),
      isLoading: false,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 2,
      displayName: 'Lovelace',
      avatarFallback: 'L',
    });
  });

  it('UD-9: returns tier 3 with email local-part when both names are empty', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: '', lastName: '', email: 'ada.lovelace@example.com' }),
      isLoading: false,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 3,
      displayName: 'ada.lovelace',
      avatarFallback: 'A',
    });
  });

  it('UD-10: returns tier 4 when both names and email are empty', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: '', lastName: '', email: '' }),
      isLoading: false,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 4,
      displayName: FALLBACK,
      avatarFallback: 'icon',
    });
  });

  it('UD-11: returns tier 4 when email is malformed (no @)', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: '', lastName: '', email: 'no-at-sign' }),
      isLoading: false,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 4,
      displayName: FALLBACK,
      avatarFallback: 'icon',
    });
  });

  it('UD-12: preserves displayName case but uppercases initials', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: 'ada', lastName: 'lovelace' }),
      isLoading: false,
      isError: false,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 1,
      displayName: 'ada lovelace',
      avatarFallback: 'AL',
    });
  });

  it('UD-13: returns tier 4 when both isLoading and isError are true (loading takes precedence)', () => {
    const result = computeUserDisplayProjection({
      user: makeUser({ firstName: 'Ada', lastName: 'Lovelace' }),
      isLoading: true,
      isError: true,
      fallbackLabel: FALLBACK,
    });

    expect(result).toEqual({
      tier: 4,
      displayName: FALLBACK,
      avatarFallback: 'icon',
    });
  });
});
