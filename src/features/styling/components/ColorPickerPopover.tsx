import { useEffect, useId, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  STYLING_COLOR_SWATCHES,
  STYLING_SWATCH_GRID_COLUMNS,
} from '../utils/style-defaults';

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

interface ColorPickerPopoverProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label: string;
  id?: string;
  disabled?: boolean;
  triggerAriaLabel?: string;
}

/**
 * Hex-input plus 6x4 swatch color picker. Opens in a Radix popover that is
 * viewport-aware (flip/shift handled by Radix).
 *
 * - Clicking a swatch applies the color immediately and closes the popover.
 * - Typing a valid `#RRGGBB` value commits on blur/Enter.
 * - Invalid hex input is rejected (reverted to last committed value on blur).
 * - Escape closes the popover. Tab/Shift+Tab traverse input -> swatches.
 */
export function ColorPickerPopover({
  value,
  onChange,
  onBlur,
  label,
  id,
  disabled = false,
  triggerAriaLabel,
}: ColorPickerPopoverProps) {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-color`;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = (raw: string) => {
    const next = raw.trim();
    if (HEX_REGEX.test(next)) {
      const normalized = `#${next.slice(1).toUpperCase()}`;
      if (normalized.toLowerCase() !== value.toLowerCase()) {
        onChange(normalized);
      }
      setDraft(normalized);
    } else {
      setDraft(value);
    }
  };

  const handleSwatchSelect = (swatch: string) => {
    // Update the draft BEFORE any focus shift so the input's blur handler
    // (which runs synchronously when focus moves to the trigger button)
    // sees the new value and does not re-commit the stale old value.
    setDraft(swatch);
    if (swatch.toLowerCase() !== value.toLowerCase()) {
      onChange(swatch);
    }
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div data-slot="color-picker" className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            id={inputId}
            disabled={disabled}
            aria-label={triggerAriaLabel ?? label}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <span
              aria-hidden="true"
              data-slot="color-swatch-preview"
              className="inline-block size-5 rounded-sm border border-border"
              style={{ backgroundColor: HEX_REGEX.test(value) ? value : '#FFFFFF' }}
            />
            <span className="font-mono text-xs uppercase text-muted-foreground">
              {value}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          avoidCollisions
          collisionPadding={12}
          sideOffset={6}
          onEscapeKeyDown={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
          className="w-64"
        >
          <div className="flex flex-col gap-2.5">
            <Label
              htmlFor={`${inputId}-hex`}
              className="text-xs text-muted-foreground"
            >
              {label}
            </Label>
            <Input
              id={`${inputId}-hex`}
              data-slot="color-hex-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                commit(draft);
                onBlur?.();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commit(draft);
                }
              }}
              maxLength={7}
              className="font-mono text-xs uppercase"
              aria-invalid={!HEX_REGEX.test(draft)}
            />
            <div
              data-slot="color-swatch-grid"
              role="listbox"
              aria-label={label}
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${STYLING_SWATCH_GRID_COLUMNS}, minmax(0, 1fr))`,
              }}
            >
              {STYLING_COLOR_SWATCHES.map((swatch) => {
                const selected =
                  swatch.value.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    aria-label={swatch.value}
                    data-group={swatch.group}
                    onClick={() => handleSwatchSelect(swatch.value)}
                    className={cn(
                      'size-7 rounded-sm border border-border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected && 'ring-2 ring-ring',
                    )}
                    style={{ backgroundColor: swatch.value }}
                  />
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
