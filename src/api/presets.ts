import type { SystemStylePreset, UserSavedPreset, StyleEntry } from '@/lib/types';
import { apiClient } from './client';

export async function getSystemPresets(): Promise<SystemStylePreset[]> {
  const res = await apiClient.get<SystemStylePreset[]>('/presets');
  return res.data;
}

export async function getUserPresets(): Promise<UserSavedPreset[]> {
  const res = await apiClient.get<UserSavedPreset[]>('/users/me/presets');
  return res.data;
}

export async function createUserPreset(data: {
  name: string;
  styles: StyleEntry[];
}): Promise<UserSavedPreset> {
  const res = await apiClient.post<UserSavedPreset>('/users/me/presets', data);
  return res.data;
}

export async function renameUserPreset(
  id: string,
  name: string,
): Promise<UserSavedPreset> {
  const res = await apiClient.put<UserSavedPreset>(`/users/me/presets/${id}`, {
    name,
  });
  return res.data;
}

export async function deleteUserPreset(id: string): Promise<void> {
  await apiClient.delete(`/users/me/presets/${id}`);
}
