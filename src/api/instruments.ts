import type { Instrument } from '@/lib/types';
import { apiClient } from './client';

export async function getInstruments(): Promise<Instrument[]> {
  const res = await apiClient.get<Instrument[]>('/instruments');
  return res.data;
}
