import { useTranslation } from 'react-i18next';
import type { FontFamily } from '@/lib/types';
import {
  FONT_FAMILY_PREVIEW_OPTIONS,
  FONT_FAMILY_PREVIEW_SAMPLE_KEY,
} from '../utils/style-defaults';
import { cn } from '@/lib/utils';

interface FontFamilyPreviewProps {
  value: FontFamily;
  className?: string;
}

/**
 * Renders a short sample string using the selected font family. Used inside
 * the style editor tab to give users a live rendering of the chosen font.
 */
export function FontFamilyPreview({ value, className }: FontFamilyPreviewProps) {
  const { t } = useTranslation();
  const option =
    FONT_FAMILY_PREVIEW_OPTIONS.find((opt) => opt.value === value) ??
    FONT_FAMILY_PREVIEW_OPTIONS[0];
  return (
    <span
      data-slot="font-family-preview"
      data-font={option.value}
      className={cn(
        'text-sm text-foreground',
        option.previewClassName,
        className,
      )}
    >
      {t(FONT_FAMILY_PREVIEW_SAMPLE_KEY)}
    </span>
  );
}
