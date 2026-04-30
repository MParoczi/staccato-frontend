import { useTranslation } from 'react-i18next';
import { Bold, Redo2, Undo2 } from 'lucide-react';
import type { BuildingBlockType, ModuleType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AddBlockPopover } from './AddBlockPopover';
import { SaveIndicator } from './SaveIndicator';
import type { ContentSaveStatus } from '@/features/notebooks/hooks/useModuleContentMutation';

export interface EditorToolbarProps {
  moduleType: ModuleType;
  canUndo: boolean;
  canRedo: boolean;
  isBoldActive: boolean;
  saveStatus: ContentSaveStatus;
  onAddBlock: (type: BuildingBlockType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleBold: () => void;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * Sticky 40 px toolbar (UI-SPEC §4.3). Hosts the Add Block popover, Bold
 * toggle (`aria-pressed`), Undo/Redo, save indicator, Cancel and Save.
 *
 * Breadcrumb modules: Add Block popover is disabled (auto-gen content) and
 * Save is disabled with a "nothing to save here" tooltip.
 */
export function EditorToolbar({
  moduleType,
  canUndo,
  canRedo,
  isBoldActive,
  saveStatus,
  onAddBlock,
  onUndo,
  onRedo,
  onToggleBold,
  onCancel,
  onSave,
}: EditorToolbarProps) {
  const { t } = useTranslation();
  const isBreadcrumb = moduleType === 'Breadcrumb';

  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="toolbar"
        aria-label={t('editor.edit')}
        data-editor-toolbar=""
        className="sticky top-0 z-10 flex h-10 items-center gap-1 border-b bg-card px-2"
      >
        <AddBlockPopover
          moduleType={moduleType}
          onSelect={onAddBlock}
          disabled={isBreadcrumb}
        />

        <span aria-hidden className="mx-1 h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('editor.bold')}
              aria-pressed={isBoldActive}
              data-active={isBoldActive ? 'true' : 'false'}
              className="size-7 data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
              onClick={onToggleBold}
              disabled={isBreadcrumb}
            >
              <Bold className="size-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('editor.bold')} (Ctrl+B)</TooltipContent>
        </Tooltip>

        <span aria-hidden className="mx-1 h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('editor.undo')}
              className="size-7"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <Undo2 className="size-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('editor.undo')} (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('editor.redo')}
              className="size-7"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <Redo2 className="size-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('editor.redo')} (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <SaveIndicator status={saveStatus} />

        <span aria-hidden className="mx-1 h-5 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </Button>

        {isBreadcrumb ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-7"
                  disabled
                >
                  {t('common.save')}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t('editor.breadcrumbNoSave')}</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-7"
            onClick={onSave}
          >
            {t('common.save')}
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}

