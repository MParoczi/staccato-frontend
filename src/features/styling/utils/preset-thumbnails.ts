import type {
  ModuleType,
  NotebookModuleStyle,
  StyleEntry,
} from '@/lib/types';
import { MODULE_STYLE_TAB_ORDER } from './style-defaults';
import { deserializeModuleStyle } from './style-serialization';

export interface PresetThumbnailSwatch {
  readonly moduleType: ModuleType;
  readonly backgroundColor: string;
  readonly headerBgColor: string;
}

const FALLBACK_BACKGROUND = '#FFFFFF';
const FALLBACK_HEADER = '#F0E6D3';

function moduleTypeOrder(moduleType: ModuleType): number {
  const index = MODULE_STYLE_TAB_ORDER.indexOf(moduleType);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/**
 * Derives 4×3 thumbnail swatches from a system preset's 12 styles, ordered
 * according to `MODULE_STYLE_TAB_ORDER` for visual consistency.
 */
export function systemPresetSwatches(
  styles: readonly NotebookModuleStyle[],
): PresetThumbnailSwatch[] {
  return [...styles]
    .sort(
      (a, b) =>
        moduleTypeOrder(a.moduleType) - moduleTypeOrder(b.moduleType),
    )
    .map((style) => ({
      moduleType: style.moduleType,
      backgroundColor: style.backgroundColor,
      headerBgColor: style.headerBgColor,
    }));
}

/**
 * Derives 4×3 thumbnail swatches from a user preset's serialized style
 * entries. Invalid/missing entries fall back to neutral values so the card
 * can still render without crashing.
 */
export function userPresetSwatches(
  entries: readonly StyleEntry[],
): PresetThumbnailSwatch[] {
  const byType = new Map<ModuleType, PresetThumbnailSwatch>();
  for (const entry of entries) {
    try {
      const deserialized = deserializeModuleStyle(entry.stylesJson);
      byType.set(entry.moduleType as ModuleType, {
        moduleType: entry.moduleType as ModuleType,
        backgroundColor: deserialized.backgroundColor,
        headerBgColor: deserialized.headerBgColor,
      });
    } catch {
      byType.set(entry.moduleType as ModuleType, {
        moduleType: entry.moduleType as ModuleType,
        backgroundColor: FALLBACK_BACKGROUND,
        headerBgColor: FALLBACK_HEADER,
      });
    }
  }
  return MODULE_STYLE_TAB_ORDER.map(
    (moduleType) =>
      byType.get(moduleType) ?? {
        moduleType,
        backgroundColor: FALLBACK_BACKGROUND,
        headerBgColor: FALLBACK_HEADER,
      },
  );
}
