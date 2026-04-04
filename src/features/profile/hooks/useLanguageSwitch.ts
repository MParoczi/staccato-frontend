import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { toast } from 'sonner';
import { updateMe } from '@/api/users';
import type { User, UpdateProfileRequest, Language } from '@/lib/types';

export function useLanguageSwitch() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (newLanguage: Language) => {
      const cached = queryClient.getQueryData<User>(['user', 'profile']);
      const request: UpdateProfileRequest = {
        firstName: cached?.firstName ?? '',
        lastName: cached?.lastName ?? '',
        language: newLanguage,
        defaultPageSize: cached?.defaultPageSize ?? null,
        defaultInstrumentId: cached?.defaultInstrumentId ?? null,
      };
      return updateMe(request);
    },
    onMutate: async (newLanguage: Language) => {
      await queryClient.cancelQueries({ queryKey: ['user', 'profile'] });

      const previousProfile = queryClient.getQueryData<User>([
        'user',
        'profile',
      ]);
      const previousLanguage = i18next.language as Language;

      await i18next.changeLanguage(newLanguage);

      if (previousProfile) {
        queryClient.setQueryData<User>(['user', 'profile'], {
          ...previousProfile,
          language: newLanguage,
        });
      }

      return { previousProfile, previousLanguage };
    },
    onError: (_error, _newLanguage, context) => {
      if (context?.previousLanguage) {
        void i18next.changeLanguage(context.previousLanguage);
      }
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
