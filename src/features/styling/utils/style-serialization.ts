import type {
  BorderStyle,
  FontFamily,
  ModuleType,
  NotebookModuleStyle,
  StyleEntry,
} from '@/lib/types';
import { MODULE_TYPES, type ModuleStyleFormValues } from './style-schema';

/**
 * Serialization contract (v1) for `StyleEntry.stylesJson`:
 * - Stores a JSON object with the exact camelCase keys listed below.
 * - All 9 keys are required; omitted fields are not allowed.
 * - The serialized payload does NOT include `id`, `notebookId`, or
 *   `moduleType` because those are carried externally.
 */
const STYLE_KEYS = [
  'backgroundColor',
  'borderColor',
  'borderStyle',
  'borderWidth',
  'borderRadius',
  'headerBgColor',
  'headerTextColor',
  'bodyTextColor',
  'fontFamily',
] as const satisfies readonly (keyof ModuleStyleFormValues)[];

export type SerializedModuleStyle = ModuleStyleFormValues;

function toModuleStyleFormValues(value: unknown): ModuleStyleFormValues {
  if (value === null || typeof value !== 'object') {
    throw new Error('Invalid style payload: not an object');
  }
  const record = value as Record<string, unknown>;
  const result: Partial<ModuleStyleFormValues> = {};
  for (const key of STYLE_KEYS) {
    if (!(key in record)) {
      throw new Error(`Invalid style payload: missing key "${key}"`);
    }
  }
  result.backgroundColor = String(record.backgroundColor);
  result.borderColor = String(record.borderColor);
  result.borderStyle = record.borderStyle as BorderStyle;
  result.borderWidth = Number(record.borderWidth);
  result.borderRadius = Number(record.borderRadius);
  result.headerBgColor = String(record.headerBgColor);
  result.headerTextColor = String(record.headerTextColor);
  result.bodyTextColor = String(record.bodyTextColor);
  result.fontFamily = record.fontFamily as FontFamily;
  return result as ModuleStyleFormValues;
}

/**
 * Serialize a single module style's editable properties into the v1 JSON
 * string used by `StyleEntry.stylesJson`.
 */
export function serializeModuleStyle(style: ModuleStyleFormValues): string {
  const payload: ModuleStyleFormValues = {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderStyle: style.borderStyle,
    borderWidth: style.borderWidth,
    borderRadius: style.borderRadius,
    headerBgColor: style.headerBgColor,
    headerTextColor: style.headerTextColor,
    bodyTextColor: style.bodyTextColor,
    fontFamily: style.fontFamily,
  };
  return JSON.stringify(payload);
}

/**
 * Deserialize a `StyleEntry.stylesJson` string into an editable module style
 * object. Throws if the JSON is invalid or any required key is missing.
 */
export function deserializeModuleStyle(json: string): ModuleStyleFormValues {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid style payload: malformed JSON');
  }
  return toModuleStyleFormValues(parsed);
}

/**
 * Convert a 12-entry array of `NotebookModuleStyle` into the `StyleEntry[]`
 * payload used when creating a user preset. The input order does not matter;
 * output entries are emitted in the canonical `MODULE_TYPES` order.
 */
export function notebookStylesToEntries(
  styles: readonly NotebookModuleStyle[],
): StyleEntry[] {
  const byType = new Map<ModuleType, NotebookModuleStyle>();
  for (const style of styles) {
    byType.set(style.moduleType, style);
  }
  return MODULE_TYPES.map((moduleType) => {
    const style = byType.get(moduleType);
    if (!style) {
      throw new Error(`Missing style for module type "${moduleType}"`);
    }
    return {
      moduleType,
      stylesJson: serializeModuleStyle({
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderStyle: style.borderStyle,
        borderWidth: style.borderWidth,
        borderRadius: style.borderRadius,
        headerBgColor: style.headerBgColor,
        headerTextColor: style.headerTextColor,
        bodyTextColor: style.bodyTextColor,
        fontFamily: style.fontFamily,
      }),
    };
  });
}

/**
 * Convert a `StyleEditorFormValues["styles"]` map into the `StyleEntry[]`
 * payload used when creating a user preset.
 */
export function formStylesToEntries(
  styles: Record<ModuleType, ModuleStyleFormValues>,
): StyleEntry[] {
  return MODULE_TYPES.map((moduleType) => ({
    moduleType,
    stylesJson: serializeModuleStyle(styles[moduleType]),
  }));
}

/**
 * Convert a 12-entry array of `StyleEntry` (from a user preset) into the
 * form-ready map keyed by `ModuleType`. Throws if any entry is missing or has
 * an unknown module type.
 */
export function entriesToFormStyles(
  entries: readonly StyleEntry[],
): Record<ModuleType, ModuleStyleFormValues> {
  const moduleTypeSet = new Set<string>(MODULE_TYPES);
  const byType = new Map<ModuleType, ModuleStyleFormValues>();
  for (const entry of entries) {
    if (!moduleTypeSet.has(entry.moduleType)) {
      throw new Error(`Unknown module type "${entry.moduleType}"`);
    }
    byType.set(
      entry.moduleType as ModuleType,
      deserializeModuleStyle(entry.stylesJson),
    );
  }
  const result = {} as Record<ModuleType, ModuleStyleFormValues>;
  for (const moduleType of MODULE_TYPES) {
    const value = byType.get(moduleType);
    if (!value) {
      throw new Error(`Missing style entry for module type "${moduleType}"`);
    }
    result[moduleType] = value;
  }
  return result;
}
