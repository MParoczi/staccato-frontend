import { client } from '@/api/client'
import type { LessonPage } from '@/types'

export async function getLessonPages(lessonId: string): Promise<LessonPage[]> {
  const { data } = await client.get<LessonPage[]>(`/lessons/${lessonId}/pages`)
  return data
}

export async function addPage(lessonId: string): Promise<LessonPage> {
  const { data } = await client.post<LessonPage>(`/lessons/${lessonId}/pages`)
  return data
}

export async function deletePage(lessonId: string, pageId: string): Promise<void> {
  await client.delete(`/lessons/${lessonId}/pages/${pageId}`)
}
