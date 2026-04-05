import { cn } from '@/lib/utils';
import type { SystemStylePreset } from '@/lib/types';

interface PresetThumbnailProps {
  preset: SystemStylePreset;
  selected: boolean;
  onClick: () => void;
}

export function PresetThumbnail({ preset, selected, onClick }: PresetThumbnailProps) {
  const displayStyles = preset.styles.slice(0, 12);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={preset.name}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary'
          : 'border-border hover:border-foreground/30',
      )}
      onClick={onClick}
    >
      <div className="grid grid-cols-3 gap-0.5">
        {displayStyles.map((style, index) => (
          <div
            key={index}
            className="flex h-5 w-6 flex-col overflow-hidden rounded-xs"
          >
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: style.headerBgColor }}
            />
            <div
              className="flex-1"
              style={{ backgroundColor: style.backgroundColor }}
            />
          </div>
        ))}
      </div>
      <span className="text-xs font-medium">{preset.name}</span>
    </button>
  );
}
