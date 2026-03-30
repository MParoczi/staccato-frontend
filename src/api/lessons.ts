import type { LessonSummary, LessonDetail } from '@/lib/types';
import { apiClient } from './client';

export async function getLessons(notebookId: string): Promise<LessonSummary[]> {
  const res = await apiClient.get<LessonSummary[]>(`/notebooks/${notebookId}/lessons`);
  return res.data;
}

export async function getLesson(notebookId: string, lessonId: string): Promise<LessonDetail> {
  const res = await apiClient.get<LessonDetail>(`/notebooks/${notebookId}/lessons/${lessonId}`);
  return res.data;
}

export async function createLesson(
  notebookId: string,
  data: { title: string },
): Promise<LessonDetail> {
  const res = await apiClient.post<LessonDetail>(`/notebooks/${notebookId}/lessons`, data);
  return res.data;
}

export async function updateLesson(
  notebookId: string,
  lessonId: string,
  data: { title: string },
): Promise<LessonDetail> {
  const res = await apiClient.patch<LessonDetail>(
    `/notebooks/${notebookId}/lessons/${lessonId}`,
    data,
  );
  return res.data;
}

export async function deleteLesson(notebookId: string, lessonId: string): Promise<void> {
  await apiClient.delete(`/notebooks/${notebookId}/lessons/${lessonId}`);
}
