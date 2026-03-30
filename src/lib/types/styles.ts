import type { NotebookModuleStyle } from './notebooks';

export interface SystemStylePreset {
  id: string;
  name: string;
  displayOrder: number;
  isDefault: boolean;
  styles: NotebookModuleStyle[];
}

export interface StyleEntry {
  moduleType: string;
  stylesJson: string;
}

export interface UserSavedPreset {
  id: string;
  name: string;
  styles: StyleEntry[];
}
