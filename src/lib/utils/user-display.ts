import type { User } from '@/lib/types/auth';

export type UserDisplayProjection =
  | {
      tier: 1;
      displayName: string;
      avatarFallback: string;
    }
  | {
      tier: 2;
      displayName: string;
      avatarFallback: string;
    }
  | {
      tier: 3;
      displayName: string;
      avatarFallback: string;
    }
  | {
      tier: 4;
      displayName: string;
      avatarFallback: 'icon';
    };

export function computeUserDisplayProjection(input: {
  user: User | null | undefined;
  isLoading: boolean;
  isError: boolean;
  fallbackLabel: string;
}): UserDisplayProjection {
  const { user, isLoading, isError, fallbackLabel } = input;

  if (isLoading || isError) {
    return { tier: 4, displayName: fallbackLabel, avatarFallback: 'icon' };
  }

  if (!user) {
    return { tier: 4, displayName: fallbackLabel, avatarFallback: 'icon' };
  }

  const firstName = user.firstName.trim();
  const lastName = user.lastName.trim();

  if (firstName && lastName) {
    return {
      tier: 1,
      displayName: `${firstName} ${lastName}`,
      avatarFallback: `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`,
    };
  }

  if (firstName || lastName) {
    const name = firstName || lastName;
    return {
      tier: 2,
      displayName: name,
      avatarFallback: name[0].toUpperCase(),
    };
  }

  const email = user.email;
  if (email && email.includes('@')) {
    const localPart = email.split('@')[0];
    return {
      tier: 3,
      displayName: localPart,
      avatarFallback: localPart[0].toUpperCase(),
    };
  }

  return { tier: 4, displayName: fallbackLabel, avatarFallback: 'icon' };
}
