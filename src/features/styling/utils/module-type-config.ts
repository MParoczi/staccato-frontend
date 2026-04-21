import type { BorderStyle, ModuleType } from '@/lib/types';

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
