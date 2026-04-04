import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { UseFormSetError } from 'react-hook-form';
import { updateMe } from '@/api/users';
import type {
  User,
  UpdateProfileRequest,
  ValidationErrorResponse,
  BusinessErrorResponse,
} from '@/lib/types';
import type { ProfileFormData } from '../schemas/profile-schema';

export function useUpdateProfile(
  setError: UseFormSetError<ProfileFormData>,
) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (formData: ProfileFormData) => {
      const cached = queryClient.getQueryData<User>(['user', 'profile']);
      const request: UpdateProfileRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        language: cached?.language ?? 'en',
        defaultPageSize: cached?.defaultPageSize ?? null,
        defaultInstrumentId: cached?.defaultInstrumentId ?? null,
      };
      return updateMe(request);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast.success(t('profile.success.saved'));
    },
    onError: (error: AxiosError) => {
      const status = error.response?.status;

      if (status === 400) {
        const data = error.response?.data as ValidationErrorResponse | undefined;
        if (data?.errors) {
          for (const [field, messages] of Object.entries(data.errors)) {
            const fieldName = field.charAt(0).toLowerCase() + field.slice(1);
            if (fieldName === 'firstName' || fieldName === 'lastName') {
              setError(fieldName, { message: messages[0] });
            }
          }
          return;
        }
      }

      const businessError = error.response?.data as BusinessErrorResponse | undefined;
      if (businessError?.message) {
        toast.error(businessError.message);
      } else {
        toast.error(t('profile.errors.saveFailed'));
      }
    },
  });
}
