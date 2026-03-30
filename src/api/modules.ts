import type { Module, ModuleType, BuildingBlock } from '@/lib/types';
import { apiClient } from './client';

export async function getModules(pageId: string): Promise<Module[]> {
  const res = await apiClient.get<Module[]>(`/pages/${pageId}/modules`);
  return res.data;
}

export async function createModule(
  pageId: string,
  data: {
    moduleType: ModuleType;
    gridX: number;
    gridY: number;
    gridWidth: number;
    gridHeight: number;
  },
): Promise<Module> {
  const res = await apiClient.post<Module>(`/pages/${pageId}/modules`, data);
  return res.data;
}

export async function updateModule(
  moduleId: string,
  data: Partial<{
    gridX: number;
    gridY: number;
    gridWidth: number;
    gridHeight: number;
    zIndex: number;
    content: BuildingBlock[];
  }>,
): Promise<Module> {
  const res = await apiClient.patch<Module>(`/modules/${moduleId}`, data);
  return res.data;
}

export async function deleteModule(moduleId: string): Promise<void> {
  await apiClient.delete(`/modules/${moduleId}`);
}
