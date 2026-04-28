import { MODULE_MIN_SIZES } from '@/lib/constants/modules';
import type { Module, ModuleLayout, ModuleType } from '@/lib/types';
import type { PageSize } from '@/lib/types/common';
import { isWithinPageBounds } from './grid-layout';
import { checkOverlap } from './overlap';

export type LayoutValidationCode =
  | 'OUT_OF_BOUNDS'
  | 'BELOW_MIN_SIZE'
  | 'OVERLAP';

export interface LayoutValidationResult {
  isValid: boolean;
  code: LayoutValidationCode | null;
  conflictingModule: Module | null;
}

export interface ValidateLayoutInput {
  layout: Pick<
    ModuleLayout,
    'gridX' | 'gridY' | 'gridWidth' | 'gridHeight'
  >;
  moduleType: ModuleType;
  pageSize: PageSize;
  allModules: readonly Module[];
  excludeId?: string;
}

const VALID_RESULT: LayoutValidationResult = {
  isValid: true,
  code: null,
  conflictingModule: null,
};

/**
 * Returns true when the candidate layout is at least as large as the
 * module type's minimum size from `MODULE_MIN_SIZES`.
 */
export function meetsMinimumSize(
  layout: Pick<ModuleLayout, 'gridWidth' | 'gridHeight'>,
  moduleType: ModuleType,
): boolean {
  const min = MODULE_MIN_SIZES[moduleType];
  return layout.gridWidth >= min.minWidth && layout.gridHeight >= min.minHeight;
}

/**
 * Composed validation pipeline run before any optimistic layout mutation.
 * Order matches the spec: bounds first, then min-size, then overlap, so the
 * UI surfaces the most fundamental rejection reason when a layout fails
 * multiple checks.
 */
export function validateLayout({
  layout,
  moduleType,
  pageSize,
  allModules,
  excludeId,
}: ValidateLayoutInput): LayoutValidationResult {
  if (!isWithinPageBounds(layout, pageSize)) {
    return {
      isValid: false,
      code: 'OUT_OF_BOUNDS',
      conflictingModule: null,
    };
  }

  if (!meetsMinimumSize(layout, moduleType)) {
    return {
      isValid: false,
      code: 'BELOW_MIN_SIZE',
      conflictingModule: null,
    };
  }

  const conflict = checkOverlap(layout, allModules, excludeId);
  if (conflict !== null) {
    return {
      isValid: false,
      code: 'OVERLAP',
      conflictingModule: conflict,
    };
  }

  return VALID_RESULT;
}
