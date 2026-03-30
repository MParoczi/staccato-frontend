import type { PdfExport } from '@/lib/types';
import { apiClient } from './client';

export async function getExports(): Promise<PdfExport[]> {
  const res = await apiClient.get<PdfExport[]>('/exports');
  return res.data;
}

export async function createExport(data: {
  notebookId: string;
  lessonIds?: string[];
}): Promise<PdfExport> {
  const res = await apiClient.post<PdfExport>('/exports', data);
  return res.data;
}

export async function getExportDownloadUrl(exportId: string): Promise<{ url: string }> {
  const res = await apiClient.get<{ url: string }>(`/exports/${exportId}/download`);
  return res.data;
}
