import type { LessonPageWithWarning } from '@/lib/types';
import { apiClient } from './client';

export async function createPage(lessonId: string): Promise<LessonPageWithWarning> {
  const res = await apiClient.post<LessonPageWithWarning>(`/lessons/${lessonId}/pages`);
  return res.data;
}

export async function deletePage(lessonId: string, pageId: string): Promise<void> {
  await apiClient.delete(`/lessons/${lessonId}/pages/${pageId}`);
}
