import { client } from '@/api/client'
import type { Notebook, CreateNotebookPayload, UpdateNotebookPayload } from '@/types'

export async function getNotebooks(): Promise<Notebook[]> {
  const { data } = await client.get<Notebook[]>('/notebooks')
  return data
}

export async function getNotebook(id: string): Promise<Notebook> {
  const { data } = await client.get<Notebook>(`/notebooks/${id}`)
  return data
}

export async function createNotebook(payload: CreateNotebookPayload): Promise<Notebook> {
  const { data } = await client.post<Notebook>('/notebooks', payload)
  return data
}

export async function updateNotebook(id: string, payload: UpdateNotebookPayload): Promise<Notebook> {
  const { data } = await client.patch<Notebook>(`/notebooks/${id}`, payload)
  return data
}

export async function deleteNotebook(id: string): Promise<void> {
  await client.delete(`/notebooks/${id}`)
}
