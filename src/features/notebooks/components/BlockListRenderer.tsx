import { type FC } from 'react';
import type { BuildingBlock } from '@/lib/types';
import { BLOCK_REGISTRY } from '@/features/notebooks/blocks/registry';

export interface BlockListRendererProps {
  blocks: BuildingBlock[];
}

/**
 * View-mode renderer for a module's `BuildingBlock[]`.
 *
 * Each block is dispatched through `BLOCK_REGISTRY[type].Renderer`. Used by
 * `ModuleCard` when not in edit mode (plan 01-06 task 6.4). Unimplemented
 * block types fall back to the placeholder renderer registered in
 * `BLOCK_REGISTRY`.
 */
export const BlockListRenderer: FC<BlockListRendererProps> = ({ blocks }) => {
  if (blocks.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => {
        const desc = BLOCK_REGISTRY[block.type];
        const Renderer = desc.Renderer;
        return <Renderer key={index} block={block} />;
      })}
    </div>
  );
};

