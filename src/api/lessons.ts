import type { LessonSummary, LessonDetail } from '@/lib/types';
import { apiClient } from './client';

export async function getLessons(notebookId: string): Promise<LessonSummary[]> {
  const res = await apiClient.get<LessonSummary[]>(`/notebooks/${notebookId}/lessons`);
  return res.data;
}

// Per Staccato API (OpenAPI):
//   GET    /lessons/{id}
//   PUT    /lessons/{id}
//   DELETE /lessons/{id}
// Only the collection routes are notebook-scoped:
//   GET    /notebooks/{id}/lessons
//   POST   /notebooks/{id}/lessons
// `notebookId` is kept in the signatures below so existing hook callers remain
// untouched, but it is intentionally unused in URL construction for the
// item-scoped endpoints.
export async function getLesson(_notebookId: string, lessonId: string): Promise<LessonDetail> {
  const res = await apiClient.get<LessonDetail>(`/lessons/${lessonId}`);
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
  _notebookId: string,
  lessonId: string,
  data: { title: string },
): Promise<LessonDetail> {
  const res = await apiClient.put<LessonDetail>(`/lessons/${lessonId}`, data);
  return res.data;
}

export async function deleteLesson(_notebookId: string, lessonId: string): Promise<void> {
  await apiClient.delete(`/lessons/${lessonId}`);
}
