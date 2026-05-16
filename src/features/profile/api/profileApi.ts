import { client } from '@/api/client'
import type { UserProfile } from '@/types'

export interface UpdateProfilePayload {
  firstName?: string | null
  lastName?: string | null
  language?: string
  defaultPageSize?: string | null
  defaultInstrumentId?: string | null
}

export interface InstrumentOption {
  id: string
  name: string
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await client.get<UserProfile>('/users/me')
  return data
}

export async function updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
  const { data } = await client.put<UserProfile>('/users/me', payload)
  return data
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData()
  formData.append('File', file)
  const { data } = await client.put<{ avatarUrl: string }>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function requestDeletion(): Promise<void> {
  await client.delete('/users/me')
}

export async function cancelDeletion(): Promise<void> {
  await client.post('/users/me/cancel-deletion')
}

export async function getInstruments(): Promise<InstrumentOption[]> {
  const { data } = await client.get<InstrumentOption[]>('/instruments')
  return data
}
