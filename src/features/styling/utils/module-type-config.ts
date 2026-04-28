import type { BorderStyle, BuildingBlockType, ModuleType } from '@/lib/types';

export type ModuleStyleControl =
  | 'backgroundColor'
  | 'borderColor'
  | 'borderStyle'
  | 'borderWidth'
  | 'borderRadius'
  | 'headerBgColor'
  | 'headerTextColor'
  | 'bodyTextColor'
  | 'fontFamily';

const ALL_CONTROLS: readonly ModuleStyleControl[] = [
  'backgroundColor',
  'borderColor',
  'borderStyle',
  'borderWidth',
  'borderRadius',
  'headerBgColor',
  'headerTextColor',
  'bodyTextColor',
  'fontFamily',
] as const;

const TITLE_SUBTITLE_CONTROLS: readonly ModuleStyleControl[] = [
  'bodyTextColor',
  'fontFamily',
] as const;

/**
 * Returns the ordered list of style controls that are user-editable for the
 * given module type.
 *
 * - Title and Subtitle expose only `bodyTextColor` and `fontFamily`; the other
 *   properties exist in the data model and MUST be preserved from the
 *   server-loaded values when the user saves.
 * - All other module types expose all nine controls.
 */
export function getVisibleControls(
  moduleType: ModuleType,
): readonly ModuleStyleControl[] {
  if (moduleType === 'Title' || moduleType === 'Subtitle') {
    return TITLE_SUBTITLE_CONTROLS;
  }
  return ALL_CONTROLS;
}

/**
 * Returns true if the given control should be visible in the editor for the
 * given module type.
 */
export function isControlVisible(
  moduleType: ModuleType,
  control: ModuleStyleControl,
): boolean {
  return getVisibleControls(moduleType).includes(control);
}

/**
 * Returns true if a border-dependent control (`borderColor`, `borderWidth`,
 * `borderRadius`) should be disabled because the current `borderStyle` is
 * `"None"`.
 *
 * Controls that are not border-dependent are never disabled by this rule.
 */
export function isBorderControlDisabled(
  borderStyle: BorderStyle,
  control: ModuleStyleControl,
): boolean {
  if (
    control !== 'borderColor' &&
    control !== 'borderWidth' &&
    control !== 'borderRadius'
  ) {
    return false;
  }
  return borderStyle === 'None';
}

/**
 * Per-module-type whitelist of building blocks the editor (Phase 1+)
 * may insert. Enforced both in the Add Block popover (UI gate) and in
 * the optimistic state mutation (defense-in-depth).
 *
 * - Title: only `Date` and `Text` (UI-SPEC §4.4 / §4.12).
 * - Breadcrumb: empty — content auto-generated from subtitle modules.
 * - FreeText: all 10 BuildingBlockType values.
 * - Other 9 module types: see table below (sourced from F9 prompt).
 */
export const MODULE_ALLOWED_BLOCKS: Record<
  ModuleType,
  readonly BuildingBlockType[]
> = {
  Title: ['Date', 'Text'],
  Breadcrumb: [],
  Subtitle: ['Text'],
  Theory: [
    'SectionHeading',
    'Text',
    'BulletList',
    'NumberedList',
    'CheckboxList',
    'Table',
    'MusicalNotes',
    'ChordProgression',
    'ChordTablatureGroup',
  ],
  Practice: [
    'SectionHeading',
    'Text',
    'BulletList',
    'NumberedList',
    'CheckboxList',
    'Table',
    'MusicalNotes',
    'ChordProgression',
    'ChordTablatureGroup',
  ],
  Example: [
    'SectionHeading',
    'Text',
    'BulletList',
    'NumberedList',
    'CheckboxList',
    'Table',
    'MusicalNotes',
    'ChordProgression',
    'ChordTablatureGroup',
  ],
  Important: [
    'SectionHeading',
    'Text',
    'BulletList',
    'NumberedList',
    'CheckboxList',
  ],
  Tip: [
    'SectionHeading',
    'Text',
    'BulletList',
    'NumberedList',
    'CheckboxList',
  ],
  Homework: [
    'SectionHeading',
    'Text',
    'BulletList',
    'NumberedList',
    'CheckboxList',
    'Table',
  ],
  Question: [
    'SectionHeading',
    'Text',
    'BulletList',
    'NumberedList',
    'CheckboxList',
  ],
  ChordTablature: ['Text', 'ChordTablatureGroup'],
  FreeText: [
    'SectionHeading',
    'Date',
    'Text',
    'BulletList',
    'NumberedList',
    'CheckboxList',
    'Table',
    'MusicalNotes',
    'ChordProgression',
    'ChordTablatureGroup',
  ],
} as const;

/** Returns true if the given block type may be inserted into a module of the given type. */
export function isBlockAllowed(
  moduleType: ModuleType,
  blockType: BuildingBlockType,
): boolean {
  return MODULE_ALLOWED_BLOCKS[moduleType].includes(blockType);
}

