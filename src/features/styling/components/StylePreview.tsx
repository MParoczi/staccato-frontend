import { useTranslation } from 'react-i18next';
import type { ModuleType } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { ModuleStyleFormValues } from '../utils/style-schema';
import { FONT_FAMILY_PREVIEW_OPTIONS } from '../utils/style-defaults';

interface StylePreviewProps {
  moduleType: ModuleType;
  style: ModuleStyleFormValues;
  className?: string;
}

/**
 * Renders a live mock module card on a dotted-paper background to preview
 * the user's current style selections for a given module type. Only the
 * currently-active tab drives the preview (last-tab-wins is handled by the
 * drawer passing a single `style` value).
 */
export function StylePreview({ moduleType, style, className }: StylePreviewProps) {
  const { t } = useTranslation();
  const fontOption =
    FONT_FAMILY_PREVIEW_OPTIONS.find((opt) => opt.value === style.fontFamily) ??
    FONT_FAMILY_PREVIEW_OPTIONS[0];

  const borderStyleCss =
    style.borderStyle === 'None' ? 'none' : style.borderStyle.toLowerCase();

  return (
    <div
      data-slot="style-preview"
      data-module-type={moduleType}
      aria-label={t('styling.drawer.preview')}
      className={cn(
        'relative rounded-md border border-border/50 p-4',
        'bg-[radial-gradient(circle,_theme(colors.muted-foreground/15)_1px,_transparent_1px)] bg-[length:10px_10px]',
        className,
      )}
    >
      <div
        data-slot="style-preview-card"
        className={cn('w-full overflow-hidden', fontOption.previewClassName)}
        style={{
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          borderStyle: borderStyleCss,
          borderWidth: `${style.borderWidth}px`,
          borderRadius: `${style.borderRadius}px`,
          color: style.bodyTextColor,
        }}
      >
        <div
          data-slot="style-preview-header"
          className="px-3 py-1.5 text-sm font-medium"
          style={{
            backgroundColor: style.headerBgColor,
            color: style.headerTextColor,
          }}
        >
          {t(`styling.moduleTypes.${moduleTypeKey(moduleType)}`)}
        </div>
        <div
          data-slot="style-preview-body"
          className="px-3 py-3 text-sm leading-relaxed"
          style={{ color: style.bodyTextColor }}
        >
          {t('styling.preview.fontSample')}
        </div>
      </div>
    </div>
  );
}

function moduleTypeKey(moduleType: ModuleType): string {
  return moduleType.charAt(0).toLowerCase() + moduleType.slice(1);
}
