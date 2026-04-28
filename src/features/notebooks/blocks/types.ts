import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { BuildingBlock } from '@/lib/types';

export interface BlockRendererProps {
  block: BuildingBlock;
}

export interface BlockEditorProps {
  block: BuildingBlock;
  onChange: (next: BuildingBlock) => void;
}

export interface BlockDescriptor {
  Renderer: FC<BlockRendererProps>;
  Editor: FC<BlockEditorProps>;
  /** Default factory invoked by the Add Block popover. */
  create: () => BuildingBlock;
  /** Lucide icon used in the Add Block popover (UI-SPEC §8). */
  icon: LucideIcon;
  /** i18n key for the block label (UI-SPEC §9.4). */
  labelKey: string;
  /**
   * Whether this block is fully implemented in the current build.
   * `false` → both Renderer and Editor fall back to PlaceholderBlock.
   * Plans 01-04+ flip this to `true` for `Text`.
   */
  implemented: boolean;
}

