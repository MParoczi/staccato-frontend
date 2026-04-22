import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PresetThumbnailSwatch } from '../utils/preset-thumbnails';

export interface PresetCardProps {
  /** Stable preset identifier used for keying and apply actions. */
  presetId: string;
  /** Human-readable preset name. */
  name: string;
  /** Two-tone swatches for the 4x3 thumbnail grid (12 entries, one per module type). */
  swatches: readonly PresetThumbnailSwatch[];
  /** Apply handler invoked when the apply button is activated. */
  onApply: (presetId: string) => void;
  /** True while this preset is the pending apply target. */
  isApplying?: boolean;
  /** Disables the apply control (e.g., another apply is already in flight). */
  disabled?: boolean;
  /**
   * Invoked when the user commits an inline rename via Enter or blur. Only
   * called when the new name differs from the current name. The callback
   * may return `true` to signal the rename is in flight (the card keeps
   * the input open until an error clears), or `false`/`undefined` to accept
   * the default commit behavior (the input closes).
   */
  onRename?: (presetId: string, nextName: string) => void;
  /** Invoked when the user requests deletion of the preset. */
  onDelete?: (presetId: string) => void;
  /**
   * When truthy, surfaces an inline duplicate-name error beneath the
   * rename input and keeps the input open so the user can correct the
   * value. The parent is responsible for clearing this flag when the user
   * changes the value or closes the rename.
   */
  duplicateNameError?: boolean;
  /** Clears the duplicate error flag (invoked on any input change). */
  onClearDuplicateError?: () => void;
}

/**
 * Preset thumbnail card with a 4x3 two-tone swatch grid.
 *
 * Memoized so row re-renders in the browser do not recompute the static
 * swatch DOM. Each swatch is split horizontally: the top half renders the
 * module-type's `headerBgColor` and the bottom half its `backgroundColor`.
 *
 * When `onRename` is provided, a pencil icon starts inline editing.
 * Commits on Enter or blur, cancels on Escape.
 * When `onDelete` is provided, a trash icon triggers the delete callback.
 */
const PresetCardComponent = ({
  presetId,
  name,
  swatches,
  onApply,
  isApplying = false,
  disabled = false,
  onRename,
  onDelete,
  duplicateNameError = false,
  onClearDuplicateError,
}: PresetCardProps) => {
  const { t } = useTranslation();
  const applyDisabled = disabled || isApplying;
  const canRename = Boolean(onRename);
  const canDelete = Boolean(onDelete);

  const [userEditing, setUserEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [prevName, setPrevName] = useState(name);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cancelRef = useRef(false);
  const duplicateErrorId = useId();

  const isEditing = userEditing || duplicateNameError;

  // Reset the draft whenever the canonical name changes and we aren't in
  // the middle of an active edit. Done during render per the React
  // "Resetting state when a prop changes" pattern to avoid an extra effect.
  if (prevName !== name) {
    setPrevName(name);
    if (!userEditing) setDraft(name);
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    cancelRef.current = false;
    setDraft(name);
    setUserEditing(true);
  }, [name]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setUserEditing(false);
      setDraft(name);
      onClearDuplicateError?.();
      return;
    }
    setUserEditing(false);
    onRename?.(presetId, trimmed);
  }, [draft, name, onClearDuplicateError, onRename, presetId]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setDraft(name);
    setUserEditing(false);
    onClearDuplicateError?.();
  }, [name, onClearDuplicateError]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
    },
    [cancel, commit],
  );

  const handleBlur = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    commit();
  }, [commit]);

  // Memoize the 4x3 thumbnail grid so local rename-state transitions
  // (entering/leaving edit mode, draft typing, duplicate-error flag) do not
  // rebuild the 12-cell live-preview DOM. Only recomputes when the swatches
  // or the accessible label actually change.
  const thumbnail = useMemo(
    () => (
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
    ),
    [name, swatches],
  );

  return (
    <div
      data-slot="preset-card"
      data-preset-id={presetId}
      className="flex flex-col gap-2 rounded-md border bg-card p-2 text-card-foreground shadow-sm"
    >
      {thumbnail}
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          <Input
            ref={inputRef}
            data-slot="preset-name-input"
            aria-label={t('styling.presets.renameInputLabel')}
            aria-invalid={duplicateNameError || undefined}
            aria-describedby={
              duplicateNameError ? duplicateErrorId : undefined
            }
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (duplicateNameError) onClearDuplicateError?.();
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="h-7 flex-1 text-sm"
          />
        ) : (
          <span
            data-slot="preset-name"
            title={name}
            tabIndex={0}
            className={cn(
              'min-w-0 flex-1 truncate text-sm font-medium',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm',
            )}
          >
            {name}
          </span>
        )}
        <div className="flex flex-none items-center gap-1">
          {canRename && !isEditing && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              data-slot="preset-rename"
              aria-label={t('styling.presets.rename')}
              onClick={startEditing}
              disabled={disabled}
              className="size-7"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>
          )}
          {canDelete && !isEditing && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              data-slot="preset-delete"
              aria-label={t('styling.presets.delete')}
              onClick={() => onDelete?.(presetId)}
              disabled={disabled}
              className="size-7 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-slot="preset-apply"
            onClick={() => onApply(presetId)}
            disabled={applyDisabled || isEditing}
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
      {duplicateNameError && (
        <p
          id={duplicateErrorId}
          data-slot="preset-rename-duplicate-error"
          className="text-xs text-destructive"
        >
          {t('styling.presets.duplicateName')}
        </p>
      )}
    </div>
  );
};

export const PresetCard = memo(PresetCardComponent);
