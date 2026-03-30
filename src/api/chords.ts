import type { InstrumentKey, ChordSummary, ChordDetail } from '@/lib/types';
import { apiClient } from './client';

export async function searchChords(params: {
  instrumentKey?: InstrumentKey;
  root?: string;
  quality?: string;
  query?: string;
}): Promise<ChordSummary[]> {
  const res = await apiClient.get<ChordSummary[]>('/chords', { params });
  return res.data;
}

export async function getChord(id: string): Promise<ChordDetail> {
  const res = await apiClient.get<ChordDetail>(`/chords/${id}`);
  return res.data;
}
