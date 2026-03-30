import type { User, Language, PageSize } from '@/lib/types';
import { apiClient } from './client';

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>('/users/me');
  return res.data;
}

export async function updateMe(
  data: Partial<{
    firstName: string;
    lastName: string;
    language: Language;
    defaultPageSize: PageSize | null;
    defaultInstrumentId: string | null;
  }>,
): Promise<User> {
  const res = await apiClient.patch<User>('/users/me', data);
  return res.data;
}

export async function deleteMe(): Promise<void> {
  await apiClient.delete('/users/me');
}

export async function cancelDeletion(): Promise<User> {
  const res = await apiClient.post<User>('/users/me/cancel-deletion');
  return res.data;
}
