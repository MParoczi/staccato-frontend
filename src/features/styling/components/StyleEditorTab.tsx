import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { BorderStyle, FontFamily, ModuleType } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPickerPopover } from './ColorPickerPopover';
import { FontFamilyPreview } from './FontFamilyPreview';
import type { StyleEditorFormValues } from '../utils/style-schema';
import {
  getVisibleControls,
  isBorderControlDisabled,
  type ModuleStyleControl,
} from '../utils/module-type-config';

interface StyleEditorTabProps {
  moduleType: ModuleType;
}

const BORDER_STYLES: readonly BorderStyle[] = [
  'None',
  'Solid',
  'Dashed',
  'Dotted',
] as const;

const FONT_FAMILIES: readonly FontFamily[] = [
  'Default',
  'Monospace',
  'Serif',
] as const;

const COLOR_CONTROLS: ReadonlySet<ModuleStyleControl> = new Set([
  'backgroundColor',
  'borderColor',
  'headerBgColor',
  'headerTextColor',
  'bodyTextColor',
]);

/**
 * Renders the form controls for a single module-type tab. Only user-editable
 * controls are shown (Title/Subtitle show only bodyTextColor and fontFamily).
 * Hidden properties on Title/Subtitle remain in the form state so their
 * server-loaded values are preserved on save.
 *
 * Border-dependent controls (`borderColor`, `borderWidth`, `borderRadius`) are
 * disabled when `borderStyle === 'None'`.
 */
export function StyleEditorTab({ moduleType }: StyleEditorTabProps) {
  const { t } = useTranslation();
  const { control: formControl, register, formState } =
    useFormContext<StyleEditorFormValues>();
  const visibleControls = getVisibleControls(moduleType);
  const borderStyle = useWatch({
    control: formControl,
    name: `styles.${moduleType}.borderStyle`,
  });
  const errors = formState.errors.styles?.[moduleType];

  return (
    <div
      data-slot="style-editor-tab"
      data-module-type={moduleType}
      className="flex flex-col gap-3"
    >
      {visibleControls.map((control) => {
        if (COLOR_CONTROLS.has(control)) {
          const disabled = isBorderControlDisabled(borderStyle, control);
          return (
            <Controller
              key={control}
              name={`styles.${moduleType}.${control}` as const}
              render={({ field }) => (
                <ColorPickerPopover
                  label={t(`styling.controls.${control}`)}
                  value={(field.value as string) ?? '#FFFFFF'}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled}
                />
              )}
            />
          );
        }
        if (control === 'borderStyle') {
          return (
            <Controller
              key={control}
              name={`styles.${moduleType}.borderStyle`}

              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${moduleType}-borderStyle`}>
                    {t('styling.controls.borderStyle')}
                  </Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={`${moduleType}-borderStyle`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BORDER_STYLES.map((bs) => (
                        <SelectItem key={bs} value={bs}>
                          {t(
                            `styling.controls.borderStyleOptions.${bs.toLowerCase()}`,
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          );
        }
        if (control === 'borderWidth' || control === 'borderRadius') {
          const disabled = isBorderControlDisabled(borderStyle, control);
          const max = control === 'borderWidth' ? 10 : 20;
          const errorKey = errors?.[control]?.message;
          return (
            <div key={control} className="flex flex-col gap-1.5">
              <Label htmlFor={`${moduleType}-${control}`}>
                {t(`styling.controls.${control}`)}
              </Label>
              <Input
                id={`${moduleType}-${control}`}
                type="number"
                min={0}
                max={max}
                step={1}
                disabled={disabled}
                aria-invalid={Boolean(errorKey)}
                {...register(`styles.${moduleType}.${control}` as const, {
                  valueAsNumber: true,
                })}
              />
              {errorKey && (
                <p className="text-xs text-destructive">{t(errorKey)}</p>
              )}
            </div>
          );
        }
        if (control === 'fontFamily') {
          return (
            <Controller
              key={control}
              name={`styles.${moduleType}.fontFamily`}

              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${moduleType}-fontFamily`}>
                    {t('styling.controls.fontFamily')}
                  </Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={`${moduleType}-fontFamily`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((ff) => (
                        <SelectItem key={ff} value={ff}>
                          {t(
                            `styling.controls.fontFamilyOptions.${ff.toLowerCase()}`,
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FontFamilyPreview value={field.value} />
                </div>
              )}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
