import { useMemo, useState } from 'react';
import type { BuildingBlock, TextSpan } from '@/lib/types';
import { isTextSpan } from '@/lib/types';
import { TextSpanEditor } from '../text-span-editor/TextSpanEditor';

/**
 * Storage shape (mirrors F9 PRD + Phase-2 BLOCK-01):
 *   { type: 'Text', spans: TextSpan[] }
 */

/** Defensive read: returns the spans array if present and well-formed, else []. */
function readSpans(block: BuildingBlock): TextSpan[] {
  const candidate = (block as Record<string, unknown>).spans;
  if (!Array.isArray(candidate)) return [];
  return candidate.filter((s): s is TextSpan => isTextSpan(s));
}

export interface TextBlockRendererProps {
  block: BuildingBlock;
}

/**
 * Read-only Text block renderer — used in view mode and inside non-edit-mode
 * modules. Inherits typography from the parent module style record (Phase
 * F7), so the wrapper just chains styled spans.
 */
export function TextBlockRenderer({ block }: TextBlockRendererProps) {
  const spans = readSpans(block);
  return (
    <p>
      {spans.length === 0 ? null : (
        spans.map((s, i) => (
          <span
            key={i}
            data-bold={s.bold ? 'true' : 'false'}
            style={{ fontWeight: s.bold ? 700 : 'inherit' }}
          >
            {s.text}
          </span>
        ))
      )}
    </p>
  );
}

export interface TextBlockEditorProps {
  block: BuildingBlock;
  onChange: (next: BuildingBlock) => void;
}

/**
 * Editor for a Text block. Wraps `TextSpanEditor`, manages the local bold
 * toggle state, and bridges block-level updates to the host (`onChange`).
 */
export function TextBlockEditor({ block, onChange }: TextBlockEditorProps) {
  const [isBoldActive, setBoldActive] = useState(false);
  // Memoize spans by `block` reference: readSpans creates a fresh array on
  // each call, which would otherwise hand TextSpanEditor a new `value` prop
  // reference on every parent re-render — including the cache-driven
  // re-renders fired by useModuleContentMutation.schedule on every
  // keystroke. A stable ref lets the editor short-circuit DOM rebuilds
  // when nothing actually changed.
  const spans = useMemo(() => readSpans(block), [block]);
  return (
    <TextSpanEditor
      value={spans}
      isBoldActive={isBoldActive}
      onBoldStateChange={setBoldActive}
      onChange={(nextSpans) => {
        onChange({ ...block, type: 'Text', spans: nextSpans });
      }}
    />
  );
}

