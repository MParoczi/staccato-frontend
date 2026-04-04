import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { updateMe } from '@/api/users';
import type { User, UpdateProfileRequest } from '@/lib/types';

type PreferenceField = 'defaultPageSize' | 'defaultInstrumentId';

interface PreferenceUpdate {
  field: PreferenceField;
  value: User[PreferenceField];
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ field, value }: PreferenceUpdate) => {
      const cached = queryClient.getQueryData<User>(['user', 'profile']);
      const request: UpdateProfileRequest = {
        firstName: cached?.firstName ?? '',
        lastName: cached?.lastName ?? '',
        language: cached?.language ?? 'en',
        defaultPageSize: cached?.defaultPageSize ?? null,
        defaultInstrumentId: cached?.defaultInstrumentId ?? null,
        [field]: value,
      };
      return updateMe(request);
    },
    onMutate: async ({ field, value }: PreferenceUpdate) => {
      await queryClient.cancelQueries({ queryKey: ['user', 'profile'] });

      const previousProfile = queryClient.getQueryData<User>([
        'user',
        'profile',
      ]);

      if (previousProfile) {
        queryClient.setQueryData<User>(['user', 'profile'], {
          ...previousProfile,
          [field]: value,
        });
      }

      return { previousProfile };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData<User>(
          ['user', 'profile'],
          context.previousProfile,
        );
      }
      toast.error(t('profile.errors.saveFailed'));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}
