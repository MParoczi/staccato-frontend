import type { InstrumentKey } from './common';

export interface Instrument {
  id: string;
  key: InstrumentKey;
  name: string;
  stringCount: number;
}

export interface ChordSummary {
  id: string;
  instrumentKey: InstrumentKey;
  name: string;
  root: string;
  quality: string;
  extension: string | null;
  alternation: string | null;
  previewPosition: ChordPosition;
}

export interface ChordDetail {
  id: string;
  instrumentKey: InstrumentKey;
  name: string;
  root: string;
  quality: string;
  extension: string | null;
  alternation: string | null;
  positions: ChordPosition[];
}

export interface ChordPosition {
  label: string;
  baseFret: number;
  barre: ChordBarre | null;
  strings: ChordString[];
}

export interface ChordBarre {
  fret: number;
  fromString: number;
  toString: number;
}

export interface ChordString {
  string: number;
  state: 'open' | 'fretted' | 'muted';
  fret: number | null;
  finger: number | null;
}
