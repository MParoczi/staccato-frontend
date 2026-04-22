import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { createUserPreset, getUserPresets } from '@/api/presets';
import type { StyleEntry, UserSavedPreset } from '@/lib/types';

/**
 * Maximum number of user-saved presets per user.
 *
 * Defined on the client so the UI can block further creation at the limit
 * before a request is made; the backend enforces the same cap.
 */
export const USER_PRESET_LIMIT = 20;

/**
 * Fetches the current user's saved style presets.
 *
 * - Query key: `['user', 'presets']`.
 * - `staleTime: 0` so mutations (create/rename/delete) immediately trigger a
 *   refetch on next focus/invalidation.
 * - The response from `GET /users/me/presets` is newest-first; this hook
 *   preserves that server-provided order and never applies a client-side
 *   sort heuristic.
 */
export function useUserPresets(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['user', 'presets'] as const,
    queryFn: getUserPresets,
    staleTime: 0,
    enabled: options?.enabled ?? true,
  });
}

export type CreateUserPresetErrorKind = 'duplicate' | 'limit' | 'unknown';

export function classifyCreateUserPresetError(
  error: unknown,
): CreateUserPresetErrorKind {
  const axiosErr = error as AxiosError | undefined;
  const status = axiosErr?.response?.status;
  if (status === 409) return 'duplicate';
  if (status === 422) return 'limit';
  return 'unknown';
}

interface CreateUserPresetInput {
  name: string;
  styles: StyleEntry[];
}

interface CreateUserPresetContext {
  previous: UserSavedPreset[] | undefined;
}

/**
 * Creates a new user-saved preset with an optimistic insert at the top of
 * the `['user', 'presets']` cache so the newly saved preset appears
 * immediately in newest-first order. On error the previous cache is
 * restored; on success the server response is written into the cache and
 * a refetch is triggered so the canonical newest-first order is preserved.
 *
 * Error mapping:
 * - `409 Conflict` -> `'duplicate'` (caller surfaces inline message)
 * - `422 Unprocessable Entity` -> `'limit'` (20-preset cap reached)
 * - anything else -> `'unknown'` (generic toast)
 */
export function useCreateUserPreset() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const queryKey = ['user', 'presets'] as const;

  return useMutation<
    UserSavedPreset,
    unknown,
    CreateUserPresetInput,
    CreateUserPresetContext
  >({
    mutationFn: (input) => createUserPreset(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<UserSavedPreset[]>(queryKey);
      const optimistic: UserSavedPreset = {
        id: `optimistic-${Date.now()}`,
        name: input.name,
        styles: input.styles,
      };
      queryClient.setQueryData<UserSavedPreset[]>(queryKey, [
        optimistic,
        ...(previous ?? []),
      ]);
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      const kind = classifyCreateUserPresetError(error);
      if (kind === 'limit') {
        toast.error(t('styling.presets.limitReached'));
      } else if (kind === 'unknown') {
        toast.error(t('styling.presets.createError'));
      }
      // `duplicate` is surfaced inline by the dialog; no toast.
    },
    onSuccess: (created) => {
      const previous =
        queryClient.getQueryData<UserSavedPreset[]>(queryKey) ?? [];
      // Replace any optimistic placeholder(s) (ids starting with
      // "optimistic-") with the server response at the top of the list.
      const withoutOptimistic = previous.filter(
        (p) => !p.id.startsWith('optimistic-'),
      );
      queryClient.setQueryData<UserSavedPreset[]>(queryKey, [
        created,
        ...withoutOptimistic,
      ]);
      toast.success(t('styling.presets.createSuccess'));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
