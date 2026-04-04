import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { deleteMe, cancelDeletion } from '@/api/users';
import type { BusinessErrorResponse } from '@/lib/types';

export function useScheduleDeletion() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: () => deleteMe(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast.success(t('profile.success.deletionScheduled'));
    },
    onError: (error: AxiosError) => {
      const status = error.response?.status;
      if (status === 409) {
        toast.error(t('profile.errors.deletionAlreadyScheduled'));
      } else {
        const data = error.response?.data as BusinessErrorResponse | undefined;
        if (data?.message) {
          toast.error(data.message);
        } else {
          toast.error(t('common.error'));
        }
      }
    },
  });
}

export function useCancelDeletion() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: () => cancelDeletion(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast.success(t('profile.success.deletionCanceled'));
    },
    onError: (error: AxiosError) => {
      const status = error.response?.status;
      if (status === 400) {
        toast.error(t('profile.errors.deletionNotScheduled'));
      } else {
        const data = error.response?.data as BusinessErrorResponse | undefined;
        if (data?.message) {
          toast.error(data.message);
        } else {
          toast.error(t('common.error'));
        }
      }
    },
  });
}
