import { client } from '@/api/client'
import type { Module, CreateModulePayload, PatchModuleLayoutPayload } from '@/types'

export async function getModules(pageId: string): Promise<Module[]> {
  const { data } = await client.get<Module[]>(`/pages/${pageId}/modules`)
  return data
}

export async function createModule(pageId: string, payload: CreateModulePayload): Promise<Module> {
  const { data } = await client.post<Module>(`/pages/${pageId}/modules`, payload)
  return data
}

export async function patchModuleLayout(
  moduleId: string,
  payload: PatchModuleLayoutPayload,
  signal?: AbortSignal,
): Promise<void> {
  await client.patch(`/modules/${moduleId}/layout`, payload, { signal })
}

export async function deleteModule(moduleId: string): Promise<void> {
  await client.delete(`/modules/${moduleId}`)
}
