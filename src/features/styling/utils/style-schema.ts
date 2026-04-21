import { z } from 'zod';
import type { ModuleType } from '@/lib/types';
import { MODULE_STYLE_TAB_ORDER } from './style-defaults';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const MODULE_TYPES: readonly ModuleType[] = MODULE_STYLE_TAB_ORDER;

export const hexColorSchema = z
  .string()
  .regex(HEX_COLOR_REGEX, 'styling.errors.invalidHex');

export const borderStyleSchema = z.enum(
  ['None', 'Solid', 'Dashed', 'Dotted'],
  { error: 'styling.errors.invalidBorderStyle' },
);

export const fontFamilySchema = z.enum(
  ['Default', 'Monospace', 'Serif'],
  { error: 'styling.errors.invalidFontFamily' },
);

export const borderWidthSchema = z
  .number({ error: 'styling.errors.invalidBorderWidth' })
  .int('styling.errors.invalidBorderWidth')
  .min(0, 'styling.errors.invalidBorderWidth')
  .max(10, 'styling.errors.invalidBorderWidth');

export const borderRadiusSchema = z
  .number({ error: 'styling.errors.invalidBorderRadius' })
  .int('styling.errors.invalidBorderRadius')
  .min(0, 'styling.errors.invalidBorderRadius')
  .max(20, 'styling.errors.invalidBorderRadius');

export const moduleStyleSchema = z.object({
  backgroundColor: hexColorSchema,
  borderColor: hexColorSchema,
  borderStyle: borderStyleSchema,
  borderWidth: borderWidthSchema,
  borderRadius: borderRadiusSchema,
  headerBgColor: hexColorSchema,
  headerTextColor: hexColorSchema,
  bodyTextColor: hexColorSchema,
  fontFamily: fontFamilySchema,
});

export type ModuleStyleFormValues = z.infer<typeof moduleStyleSchema>;

export const styleEditorSchema = z.object({
  styles: z.object(
    Object.fromEntries(
      MODULE_TYPES.map((t) => [t, moduleStyleSchema] as const),
    ) as Record<ModuleType, typeof moduleStyleSchema>,
  ),
});

export type StyleEditorFormValues = z.infer<typeof styleEditorSchema>;

export const presetNameSchema = z
  .string()
  .trim()
  .min(1, 'styling.errors.presetNameRequired')
  .max(50, 'styling.errors.presetNameMaxLength');
