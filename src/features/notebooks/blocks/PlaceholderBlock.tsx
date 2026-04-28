import { useTranslation } from 'react-i18next';
import type { BuildingBlockType } from '@/lib/types';
import { camelCaseLabelKeyFor } from './block-labels';

export interface PlaceholderBlockProps {
  type: BuildingBlockType;
}


export function PlaceholderBlock({ type }: PlaceholderBlockProps) {
  const { t } = useTranslation();
  const label = t(`editor.blockType.${camelCaseLabelKeyFor(type)}`);
  const a11yLabel = t('editor.placeholderBlockA11y', { type: label });
  return (
    <div
      role="note"
      aria-label={a11yLabel}
      className="rounded-sm border border-dashed border-border bg-muted/40 px-3 py-2 italic text-muted-foreground opacity-60"
    >
      [{label} — coming soon]
    </div>
  );
}

