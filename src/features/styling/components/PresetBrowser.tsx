import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  systemPresetSwatches,
  userPresetSwatches,
  type PresetThumbnailSwatch,
} from '../utils/preset-thumbnails';
import { useSystemPresets } from '../hooks/useSystemPresets';
import {
  USER_PRESET_LIMIT,
  classifyRenameUserPresetError,
  useDeleteUserPreset,
  useRenameUserPreset,
  useUserPresets,
} from '../hooks/useUserPresets';
import { PresetCard } from './PresetCard';

interface PresetBrowserProps {
  /** Whether the parent drawer is open (gates query fetching). */
  enabled?: boolean;
  /** Invoked when the user clicks apply on a preset card. */
  onApplyPreset: (presetId: string) => void;
  /** The preset id currently being applied (to show the pending spinner). */
  applyingPresetId?: string | null;
  /** When true, all apply controls are disabled (e.g., during apply). */
  isApplying?: boolean;
  /** Invoked when the user clicks the Save-as-Preset CTA. */
  onSaveAsPreset?: () => void;
}

/**
 * Browses system presets and the current user's saved presets inside the
 * style editor drawer.
 *
 * - System presets: 5 read-only, cached for 5 minutes.
 * - User presets: newest-first ordering is preserved exactly as returned by
 *   `GET /users/me/presets`; no client-side sort is applied.
 * - Each section has independent loading skeletons and empty-state copy.
 * - A "Save as preset" CTA above the user section opens the save dialog via
 *   `onSaveAsPreset`. At `USER_PRESET_LIMIT` presets, the CTA is disabled
 *   and an inline limit-reached message is shown.
 */
export function PresetBrowser({
  enabled = true,
  onApplyPreset,
  applyingPresetId = null,
  isApplying = false,
  onSaveAsPreset,
}: PresetBrowserProps) {
  const { t } = useTranslation();
  const systemPresetsQuery = useSystemPresets({ enabled });
  const userPresetsQuery = useUserPresets({ enabled });
  const renameMutation = useRenameUserPreset();
  const deleteMutation = useDeleteUserPreset();
  const [duplicateRenameId, setDuplicateRenameId] = useState<string | null>(
    null,
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const systemPresets = useMemo(
    () =>
      (systemPresetsQuery.data ?? []).map((preset) => ({
        id: preset.id,
        name: preset.name,
        swatches: systemPresetSwatches(preset.styles),
      })),
    [systemPresetsQuery.data],
  );

  const userPresets = useMemo(
    () =>
      (userPresetsQuery.data ?? []).map((preset) => ({
        id: preset.id,
        name: preset.name,
        swatches: userPresetSwatches(preset.styles),
      })),
    [userPresetsQuery.data],
  );

  const userPresetCount = userPresetsQuery.data?.length ?? 0;
  const userPresetsLoaded = !userPresetsQuery.isPending;
  const isAtLimit = userPresetsLoaded && userPresetCount >= USER_PRESET_LIMIT;
  const canSave = Boolean(onSaveAsPreset) && userPresetsLoaded && !isAtLimit;

  const pendingDeletePreset = useMemo(
    () =>
      pendingDeleteId
        ? (userPresetsQuery.data ?? []).find((p) => p.id === pendingDeleteId)
        : undefined,
    [pendingDeleteId, userPresetsQuery.data],
  );

  const handleRenameUserPreset = useCallback(
    (presetId: string, nextName: string) => {
      setDuplicateRenameId(null);
      renameMutation.mutate(
        { id: presetId, name: nextName },
        {
          onError: (error) => {
            const kind = classifyRenameUserPresetError(error);
            if (kind === 'duplicate') {
              setDuplicateRenameId(presetId);
            }
          },
        },
      );
    },
    [renameMutation],
  );

  const handleClearDuplicateRenameError = useCallback(() => {
    setDuplicateRenameId(null);
  }, []);

  const handleRequestDeleteUserPreset = useCallback((presetId: string) => {
    setPendingDeleteId(presetId);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    deleteMutation.mutate(id);
  }, [deleteMutation, pendingDeleteId]);

  return (
    <section
      data-slot="preset-browser"
      aria-label={t('styling.presets.title')}
      className="flex flex-col gap-4"
    >
      <PresetSection
        heading={t('styling.presets.system')}
        slot="preset-section-system"
        isLoading={systemPresetsQuery.isPending}
        isEmpty={systemPresets.length === 0}
        emptyText={t('styling.presets.empty')}
        presets={systemPresets}
        onApplyPreset={onApplyPreset}
        applyingPresetId={applyingPresetId}
        isApplying={isApplying}
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('styling.presets.user')}
          </h4>
          {onSaveAsPreset && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onSaveAsPreset}
              disabled={!canSave}
              data-slot="preset-save-as-trigger"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {t('styling.presets.saveAs')}
            </Button>
          )}
        </div>
        {isAtLimit && (
          <p
            data-slot="preset-limit-reached"
            className="text-xs text-muted-foreground"
          >
            {t('styling.presets.limitReached')}
          </p>
        )}
        <PresetSection
          slot="preset-section-user"
          isLoading={userPresetsQuery.isPending}
          isEmpty={userPresets.length === 0}
          emptyText={t('styling.presets.empty')}
          presets={userPresets}
          onApplyPreset={onApplyPreset}
          applyingPresetId={applyingPresetId}
          isApplying={isApplying}
          onRenamePreset={handleRenameUserPreset}
          onDeletePreset={handleRequestDeleteUserPreset}
          duplicateRenameId={duplicateRenameId}
          onClearDuplicateRenameError={handleClearDuplicateRenameError}
        />
      </div>
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(next) => {
          if (!next) handleCancelDelete();
        }}
      >
        <AlertDialogContent data-slot="preset-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('styling.presets.confirmDeleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('styling.presets.confirmDeleteMessage', {
                name: pendingDeletePreset?.name ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-slot="preset-delete-cancel">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              data-slot="preset-delete-confirm-action"
              onClick={handleConfirmDelete}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

interface PresetSectionProps {
  heading?: string;
  slot: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyText: string;
  presets: readonly {
    id: string;
    name: string;
    swatches: PresetThumbnailSwatch[];
  }[];
  onApplyPreset: (presetId: string) => void;
  applyingPresetId: string | null;
  isApplying: boolean;
  onRenamePreset?: (presetId: string, nextName: string) => void;
  onDeletePreset?: (presetId: string) => void;
  duplicateRenameId?: string | null;
  onClearDuplicateRenameError?: () => void;
}

function PresetSection({
  heading,
  slot,
  isLoading,
  isEmpty,
  emptyText,
  presets,
  onApplyPreset,
  applyingPresetId,
  isApplying,
  onRenamePreset,
  onDeletePreset,
  duplicateRenameId,
  onClearDuplicateRenameError,
}: PresetSectionProps) {
  return (
    <div data-slot={slot} className="flex flex-col gap-2">
      {heading && (
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {heading}
        </h4>
      )}
      {isLoading ? (
        <div
          data-slot={`${slot}-loading`}
          className="grid grid-cols-2 gap-2"
          aria-hidden="true"
        >
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isEmpty ? (
        <p
          data-slot={`${slot}-empty`}
          className="text-sm text-muted-foreground"
        >
          {emptyText}
        </p>
      ) : (
        <div
          data-slot={`${slot}-list`}
          className="grid grid-cols-2 gap-2"
        >
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              presetId={preset.id}
              name={preset.name}
              swatches={preset.swatches}
              onApply={onApplyPreset}
              isApplying={applyingPresetId === preset.id}
              disabled={isApplying && applyingPresetId !== preset.id}
              onRename={onRenamePreset}
              onDelete={onDeletePreset}
              duplicateNameError={duplicateRenameId === preset.id}
              onClearDuplicateError={onClearDuplicateRenameError}
            />
          ))}
        </div>
      )}
    </div>
  );
}
