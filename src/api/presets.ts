import type { SystemStylePreset, UserSavedPreset, StyleEntry } from '@/lib/types';
import { apiClient } from './client';

export async function getSystemPresets(): Promise<SystemStylePreset[]> {
  const res = await apiClient.get<SystemStylePreset[]>('/presets/system');
  return res.data;
}

export async function getUserPresets(): Promise<UserSavedPreset[]> {
  const res = await apiClient.get<UserSavedPreset[]>('/presets/user');
  return res.data;
}

export async function createUserPreset(data: {
  name: string;
  styles: StyleEntry[];
}): Promise<UserSavedPreset> {
  const res = await apiClient.post<UserSavedPreset>('/presets/user', data);
  return res.data;
}

export async function deleteUserPreset(id: string): Promise<void> {
  await apiClient.delete(`/presets/user/${id}`);
}
