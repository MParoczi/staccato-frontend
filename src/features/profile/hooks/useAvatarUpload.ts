import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { uploadAvatar, deleteAvatar } from '@/api/users';
import type { BusinessErrorResponse } from '@/lib/types';

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast.success(t('profile.success.avatarUploaded'));
    },
    onError: (error: AxiosError) => {
      const data = error.response?.data as BusinessErrorResponse | undefined;
      if (data?.message) {
        toast.error(data.message);
      } else {
        toast.error(t('profile.errors.uploadFailed'));
      }
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: () => deleteAvatar(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast.success(t('profile.success.avatarDeleted'));
    },
    onError: (error: AxiosError) => {
      const data = error.response?.data as BusinessErrorResponse | undefined;
      if (data?.message) {
        toast.error(data.message);
      } else {
        toast.error(t('common.error'));
      }
    },
  });
}
