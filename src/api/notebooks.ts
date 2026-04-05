import type {
  NotebookSummary,
  NotebookDetail,
  CreateNotebookRequest,
  NotebookIndex,
  NotebookModuleStyle,
} from '@/lib/types';
import { apiClient } from './client';

export async function getNotebooks(): Promise<NotebookSummary[]> {
  const res = await apiClient.get<NotebookSummary[]>('/notebooks');
  return res.data;
}

export async function getNotebook(id: string): Promise<NotebookDetail> {
  const res = await apiClient.get<NotebookDetail>(`/notebooks/${id}`);
  return res.data;
}

export async function createNotebook(data: CreateNotebookRequest): Promise<NotebookDetail> {
  const res = await apiClient.post<NotebookDetail>('/notebooks', data);
  return res.data;
}

export async function updateNotebook(
  id: string,
  data: Partial<{ title: string; coverColor: string }>,
): Promise<NotebookDetail> {
  const res = await apiClient.patch<NotebookDetail>(`/notebooks/${id}`, data);
  return res.data;
}

export async function deleteNotebook(id: string): Promise<void> {
  await apiClient.delete(`/notebooks/${id}`);
}

export async function getNotebookIndex(notebookId: string): Promise<NotebookIndex> {
  const res = await apiClient.get<NotebookIndex>(`/notebooks/${notebookId}/index`);
  return res.data;
}

export async function getNotebookStyles(notebookId: string): Promise<NotebookModuleStyle[]> {
  const res = await apiClient.get<NotebookModuleStyle[]>(`/notebooks/${notebookId}/styles`);
  return res.data;
}

export async function updateNotebookStyle(
  notebookId: string,
  styleId: string,
  data: Partial<NotebookModuleStyle>,
): Promise<NotebookModuleStyle> {
  const res = await apiClient.patch<NotebookModuleStyle>(
    `/notebooks/${notebookId}/styles/${styleId}`,
    data,
  );
  return res.data;
}
