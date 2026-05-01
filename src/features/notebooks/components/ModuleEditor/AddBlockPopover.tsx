import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { BuildingBlockType, ModuleType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MODULE_ALLOWED_BLOCKS } from '@/features/styling/utils/module-type-config';
import { BLOCK_REGISTRY } from '@/features/notebooks/blocks/registry';

export interface AddBlockPopoverProps {
  moduleType: ModuleType;
  onSelect: (type: BuildingBlockType) => void;
  /** Set to true for Breadcrumb modules — content is auto-generated. */
  disabled?: boolean;
}

/**
 * Add Block popover (UI-SPEC §4.4). Trigger is a ghost Button with `Plus`
 * icon. Content lists `MODULE_ALLOWED_BLOCKS[moduleType]` items each
 * rendered as a button row with the registered Lucide icon + i18n label.
 * Selecting an item calls `onSelect(type)` and closes the popover (handled
 * by Popover's controlled close on click — Radix auto-closes when focus
 * moves outside the content).
 */
export function AddBlockPopover({
  moduleType,
  onSelect,
  disabled,
}: AddBlockPopoverProps) {
  const { t } = useTranslation();
  const allowed = MODULE_ALLOWED_BLOCKS[moduleType];
  // Controlled open state so we can close the popover programmatically the
  // moment a block type is selected. Without this the popover stays open
  // (Radix only auto-closes on outside click / Escape), keystrokes go to
  // the option button instead of the freshly-mounted block, and the user
  // sees their first keystroke vanish — gap 01-07.
  const [open, setOpen] = useState(false);

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Tooltip wraps a span so disabled button still triggers it. */}
            <span>
              <Button variant="ghost" size="sm" disabled aria-label={t('editor.addBlock')}>
                <Plus className="size-4" aria-hidden />
                <span className="ml-1">{t('editor.addBlock')}</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t('editor.breadcrumbAutoGen')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('editor.addBlock')}>
          <Plus className="size-4" aria-hidden />
          <span className="ml-1">{t('editor.addBlock')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-60 max-h-[60vh] overflow-y-auto p-1"
        role="listbox"
        aria-label={t('editor.addBlock')}
        // Prevent Radix from restoring focus to the trigger button on close.
        // ModuleEditor moves focus to the freshly-appended contentEditable
        // after the React commit; Radix's default focus-restore would race
        // and steal it back, which is exactly the gap-01-07 failure mode.
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        {allowed.map((type) => {
          const desc = BLOCK_REGISTRY[type];
          const Icon = desc.icon;
          return (
            <button
              key={type}
              type="button"
              role="option"
              aria-selected="false"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
              onClick={() => {
                // Close FIRST so Radix unmounts PopoverContent before the
                // host's append handler triggers a re-render — keeps the
                // focus handoff order deterministic.
                setOpen(false);
                onSelect(type);
              }}
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">{t(desc.labelKey)}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

