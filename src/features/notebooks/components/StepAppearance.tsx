import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoverColorPicker } from './CoverColorPicker';
import { PresetSelector } from './PresetSelector';
import type { SystemStylePreset } from '@/lib/types';

interface StepAppearanceProps {
  coverColor: string;
  onCoverColorChange: (color: string) => void;
  presets: SystemStylePreset[] | undefined;
  presetsLoading: boolean;
  presetsError: boolean;
  selectedPresetId: string | null;
  onPresetChange: (presetId: string | null) => void;
  onBack: () => void;
  isPending: boolean;
}

export function StepAppearance({
  coverColor,
  onCoverColorChange,
  presets,
  presetsLoading,
  presetsError,
  selectedPresetId,
  onPresetChange,
  onBack,
  isPending,
}: StepAppearanceProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <CoverColorPicker value={coverColor} onChange={onCoverColorChange} />

      <PresetSelector
        presets={presets}
        selectedId={selectedPresetId}
        onChange={onPresetChange}
        isLoading={presetsLoading}
        isError={presetsError}
      />

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          {t('notebooks.create.back')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? t('notebooks.create.submitting') : t('notebooks.create.submit')}
        </Button>
      </div>
    </div>
  );
}
