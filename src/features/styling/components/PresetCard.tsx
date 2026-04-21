import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PresetThumbnailSwatch } from '../utils/preset-thumbnails';

export interface PresetCardProps {
  /** Stable preset identifier used for keying and apply actions. */
  presetId: string;
  /** Human-readable preset name. */
  name: string;
  /** Two-tone swatches for the 4×3 thumbnail grid (12 entries, one per module type). */
  swatches: readonly PresetThumbnailSwatch[];
  /** Apply handler invoked when the apply button is activated. */
  onApply: (presetId: string) => void;
  /** True while this preset is the pending apply target. */
  isApplying?: boolean;
  /** Disables the apply control (e.g., another apply is already in flight). */
  disabled?: boolean;
}

/**
 * Preset thumbnail card with a 4×3 two-tone swatch grid.
 *
 * Memoized so row re-renders in the browser do not recompute the static
 * swatch DOM. Each swatch is split horizontally: the top half renders the
 * module-type's `headerBgColor` and the bottom half its `backgroundColor`.
 */
const PresetCardComponent = ({
  presetId,
  name,
  swatches,
  onApply,
  isApplying = false,
  disabled = false,
}: PresetCardProps) => {
  const { t } = useTranslation();
  const applyDisabled = disabled || isApplying;

  return (
    <div
      data-slot="preset-card"
      data-preset-id={presetId}
      className="flex flex-col gap-2 rounded-md border bg-card p-2 text-card-foreground shadow-sm"
    >
      <div
        data-slot="preset-thumbnail"
        role="img"
        aria-label={name}
        className="grid gap-1 rounded-sm border bg-muted/30 p-1.5"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(3, minmax(0, 1fr))',
        }}
      >
        {swatches.map((swatch) => (
          <div
            key={swatch.moduleType}
            data-slot="preset-thumbnail-cell"
            data-module-type={swatch.moduleType}
            className="flex h-4 w-full flex-col overflow-hidden rounded-[2px] border border-border/60"
          >
            <div
              aria-hidden="true"
              className="flex-1"
              style={{ backgroundColor: swatch.headerBgColor }}
            />
            <div
              aria-hidden="true"
              className="flex-1"
              style={{ backgroundColor: swatch.backgroundColor }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span
          data-slot="preset-name"
          title={name}
          className="truncate text-sm font-medium"
        >
          {name}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-slot="preset-apply"
          onClick={() => onApply(presetId)}
          disabled={applyDisabled}
          className="flex-none"
        >
          {isApplying && (
            <Loader2
              className="size-3.5 animate-spin"
              aria-hidden="true"
            />
          )}
          {isApplying
            ? t('styling.presets.applying')
            : t('styling.presets.apply')}
        </Button>
      </div>
    </div>
  );
};

export const PresetCard = memo(PresetCardComponent);
