import type { User, UpdateProfileRequest } from '@/lib/types';
import { apiClient } from './client';

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>('/users/me');
  return res.data;
}

export async function updateMe(data: UpdateProfileRequest): Promise<User> {
  const res = await apiClient.put<User>('/users/me', data);
  return res.data;
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('File', file);
  const res = await apiClient.put<User>('/users/me/avatar', formData);
  return res.data;
}

export async function deleteAvatar(): Promise<void> {
  await apiClient.delete('/users/me/avatar');
}

export async function deleteMe(): Promise<void> {
  await apiClient.delete('/users/me');
}

export async function cancelDeletion(): Promise<void> {
  await apiClient.post('/users/me/cancel-deletion');
}
