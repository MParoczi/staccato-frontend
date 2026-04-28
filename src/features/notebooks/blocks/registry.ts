import { createElement, type FC } from 'react';
import {
  Calendar,
  CheckSquare,
  Heading,
  List,
  ListOrdered,
  Music2,
  Music3,
  Music4,
  Table2,
  Type,
} from 'lucide-react';
import type { BuildingBlock, BuildingBlockType } from '@/lib/types';
import type { BlockDescriptor, BlockEditorProps, BlockRendererProps } from './types';
import { PlaceholderBlock } from './PlaceholderBlock';

/** Build a placeholder-only descriptor for an unimplemented block type. */
function placeholderDescriptor(
  type: BuildingBlockType,
  icon: BlockDescriptor['icon'],
  labelKey: string,
): BlockDescriptor {
  const Renderer: FC<BlockRendererProps> = () => createElement(PlaceholderBlock, { type });
  const Editor: FC<BlockEditorProps> = () => createElement(PlaceholderBlock, { type });
  Renderer.displayName = `PlaceholderRenderer(${type})`;
  Editor.displayName = `PlaceholderEditor(${type})`;
  return {
    Renderer,
    Editor,
    create: (): BuildingBlock => ({ type }),
    icon,
    labelKey,
    implemented: false,
  };
}

/**
 * Type-level contract: `Record<BuildingBlockType, BlockDescriptor>` forces a
 * compile-time error if any union member is omitted from the registry.
 *
 * Plan 01-04 swaps the `Text` entry for the real Renderer/Editor pair and
 * flips `implemented` to `true`.
 */
export const BLOCK_REGISTRY: Record<BuildingBlockType, BlockDescriptor> = {
  SectionHeading: placeholderDescriptor('SectionHeading', Heading, 'editor.blockType.sectionHeading'),
  Date: placeholderDescriptor('Date', Calendar, 'editor.blockType.date'),
  Text: placeholderDescriptor('Text', Type, 'editor.blockType.text'),
  BulletList: placeholderDescriptor('BulletList', List, 'editor.blockType.bulletList'),
  NumberedList: placeholderDescriptor('NumberedList', ListOrdered, 'editor.blockType.numberedList'),
  CheckboxList: placeholderDescriptor('CheckboxList', CheckSquare, 'editor.blockType.checkboxList'),
  Table: placeholderDescriptor('Table', Table2, 'editor.blockType.table'),
  MusicalNotes: placeholderDescriptor('MusicalNotes', Music2, 'editor.blockType.musicalNotes'),
  ChordProgression: placeholderDescriptor('ChordProgression', Music3, 'editor.blockType.chordProgression'),
  ChordTablatureGroup: placeholderDescriptor('ChordTablatureGroup', Music4, 'editor.blockType.chordTablatureGroup'),
};

/** Lookup helper that throws on missing key (defense-in-depth). */
export function getBlockDescriptor(type: BuildingBlockType): BlockDescriptor {
  const d = BLOCK_REGISTRY[type];
  if (!d) throw new Error(`No descriptor registered for block type: ${type}`);
  return d;
}

