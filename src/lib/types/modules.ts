import type { BuildingBlockType, ModuleType } from './common';

export interface BuildingBlock {
  type: BuildingBlockType;
  [key: string]: unknown;
}

export interface Module {
  id: string;
  lessonPageId: string;
  moduleType: ModuleType;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  zIndex: number;
  content: BuildingBlock[];
}
