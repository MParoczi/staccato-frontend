import type { BuildingBlockType } from '@/lib/types';

/**
 * Convert a `BuildingBlockType` (PascalCase) into the camelCase suffix used by
 * the `editor.blockType.*` i18n keys defined in plan 01-01.
 *
 * Examples:
 *  - `'SectionHeading'` → `'sectionHeading'`
 *  - `'ChordTablatureGroup'` → `'chordTablatureGroup'`
 */
export function camelCaseLabelKeyFor(type: BuildingBlockType): string {
  if (!type) return type;
  return type.charAt(0).toLowerCase() + type.slice(1);
}

