import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, Trash2 } from 'lucide-react';
import type { BuildingBlock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { BLOCK_REGISTRY } from '@/features/notebooks/blocks/registry';

export interface BlockRowProps {
  block: BuildingBlock;
  index: number;
  onChange: (next: BuildingBlock) => void;
  onDelete: () => void;
  /** Props from `useSortable` (drag-handle attributes + listeners). */
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
}

/**
 * Block row chrome (UI-SPEC §4.5). 24 px left gutter for the drag handle,
 * delete button at top-right, both reveal on hover/focus-within.
 */
export function BlockRow({
  block,
  index,
  onChange,
  onDelete,
  dragHandleProps,
}: BlockRowProps) {
  const { t } = useTranslation();
  const desc = BLOCK_REGISTRY[block.type];
  const Editor = desc.Editor;

  return (
    <div
      className="group relative pl-6 pr-7"
      data-block-row=""
      data-block-index={index}
    >
      <button
        type="button"
        aria-label={t('editor.dragHandle')}
        className="absolute left-0 top-1 inline-flex size-5 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        {...dragHandleProps}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <Editor block={block} onChange={onChange} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('editor.deleteBlock')}
        className="absolute right-0 top-0 size-6 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}

