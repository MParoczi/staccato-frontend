import { client } from '@/api/client'
import type { Lesson, CreateLessonPayload, UpdateLessonPayload } from '@/types'

export async function getLessons(notebookId: string): Promise<Lesson[]> {
  const { data } = await client.get<Lesson[]>(`/notebooks/${notebookId}/lessons`)
  return data
}

export async function getLesson(id: string): Promise<Lesson> {
  const { data } = await client.get<Lesson>(`/lessons/${id}`)
  return data
}

export async function createLesson(notebookId: string, payload: CreateLessonPayload): Promise<Lesson> {
  const { data } = await client.post<Lesson>(`/notebooks/${notebookId}/lessons`, payload)
  return data
}

export async function updateLesson(id: string, payload: UpdateLessonPayload): Promise<Lesson> {
  const { data } = await client.put<Lesson>(`/lessons/${id}`, payload)
  return data
}

export async function deleteLesson(id: string): Promise<void> {
  await client.delete(`/lessons/${id}`)
}
