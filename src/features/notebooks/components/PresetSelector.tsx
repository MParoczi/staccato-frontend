import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { PresetThumbnail } from './PresetThumbnail';
import type { SystemStylePreset } from '@/lib/types';

interface PresetSelectorProps {
  presets: SystemStylePreset[] | undefined;
  selectedId: string | null;
  onChange: (presetId: string | null) => void;
  isLoading: boolean;
  isError: boolean;
}

export function PresetSelector({
  presets,
  selectedId,
  onChange,
  isLoading,
  isError,
}: PresetSelectorProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <span className="text-sm font-medium">
          {t('notebooks.create.presetLabel')}
        </span>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <span className="text-sm font-medium">
          {t('notebooks.create.presetLabel')}
        </span>
        <p className="text-sm text-muted-foreground">
          {t('common.error')}
        </p>
      </div>
    );
  }

  const sorted = presets
    ? [...presets].sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 5)
    : [];

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">
        {t('notebooks.create.presetLabel')}
      </span>
      <div role="radiogroup" aria-label={t('notebooks.create.presetLabel')} className="flex flex-wrap gap-3">
        <button
          type="button"
          role="radio"
          aria-checked={selectedId === null}
          className={cn(
            'flex h-20 w-16 flex-col items-center justify-center rounded-lg border text-xs font-medium transition-colors',
            selectedId === null
              ? 'border-primary bg-primary/5 ring-2 ring-primary'
              : 'border-border hover:border-foreground/30',
          )}
          onClick={() => onChange(null)}
        >
          {t('notebooks.create.presetNone')}
        </button>
        {sorted.map((preset) => (
          <PresetThumbnail
            key={preset.id}
            preset={preset}
            selected={selectedId === preset.id}
            onClick={() => onChange(preset.id)}
          />
        ))}
      </div>
    </div>
  );
}
