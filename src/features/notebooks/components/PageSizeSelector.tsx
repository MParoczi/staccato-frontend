import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PAGE_SIZE_DIMENSIONS } from '@/lib/constants/grid';
import type { PageSize } from '@/lib/types';

const PAGE_SIZES: PageSize[] = ['A4', 'A5', 'A6', 'B5', 'B6'];

interface PageSizeSelectorProps {
  value: PageSize | undefined;
  onChange: (size: PageSize) => void;
}

export function PageSizeSelector({ value, onChange }: PageSizeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">
        {t('notebooks.create.pageSizeLabel')}
      </span>
      <div role="radiogroup" aria-label={t('notebooks.create.pageSizeLabel')} className="flex flex-wrap gap-3">
        {PAGE_SIZES.map((size) => {
          const dims = PAGE_SIZE_DIMENSIONS[size];
          const isSelected = value === size;

          return (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'border-border hover:border-foreground/30',
              )}
              onClick={() => onChange(size)}
            >
              <div
                className="rounded-sm border border-foreground/20 bg-muted/50"
                style={{
                  width: '40px',
                  aspectRatio: `${dims.width} / ${dims.height}`,
                }}
              />
              <span className="text-sm font-medium">{size}</span>
              <span className="text-xs text-muted-foreground">
                {t('notebooks.create.pageSizeDimensions', { width: dims.width, height: dims.height })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
