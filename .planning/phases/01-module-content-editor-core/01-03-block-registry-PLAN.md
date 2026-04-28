---
plan_id: 01-03-block-registry
phase: 1
phase_name: Module Content Editor (Core)
wave: 1
depends_on: []
requirements: [EDIT-01]
autonomous: true
files_modified:
  - src/features/notebooks/blocks/registry.ts
  - src/features/notebooks/blocks/registry.test.ts
  - src/features/notebooks/blocks/PlaceholderBlock.tsx
  - src/features/notebooks/blocks/PlaceholderBlock.test.tsx
  - src/features/notebooks/blocks/types.ts
must_haves:
  truths:
    - "BLOCK_REGISTRY is typed as Record<BuildingBlockType, BlockDescriptor> — TS compile-error if a key is missing."
    - "PlaceholderBlock renders italic muted '[Type — coming soon]' for the 9 unimplemented block types and never throws."
    - "Every BuildingBlockType resolves to a valid descriptor; the Text descriptor's Renderer/Editor are imported lazily from plan 01-04 (forward declared with placeholder until then)."
---

# Plan 01-03 — Block registry framework + Placeholder block

<objective>
Define the type-level contract every block plugin must satisfy (`BlockDescriptor`), seed the `BLOCK_REGISTRY` with placeholder entries for all 10 `BuildingBlockType` values, and ship the `PlaceholderBlock` component that renders the `[Type — coming soon]` UI from UI-SPEC §4.9. Plan 01-04 swaps the `Text` entry for the real implementation.
</objective>

## Tasks

<task id="3.1" type="execute">
  <action>
    Create `src/features/notebooks/blocks/types.ts`:

    ```ts
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
      Renderer: React.FC<BlockRendererProps>;
      Editor: React.FC<BlockEditorProps>;
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
    ```
  </action>
  <read_first>
    - src/lib/types/modules.ts (BuildingBlock shape)
    - .planning/phases/01-module-content-editor-core/01-UI-SPEC.md §8 (icon mapping table)
  </read_first>
  <acceptance_criteria>
    - `test -f src/features/notebooks/blocks/types.ts` exits 0
    - `grep -q "export interface BlockDescriptor" src/features/notebooks/blocks/types.ts` exits 0
    - `grep -q "implemented: boolean" src/features/notebooks/blocks/types.ts` exits 0
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="3.2" type="tdd">
  <action>
    Create `src/features/notebooks/blocks/PlaceholderBlock.tsx` matching UI-SPEC §4.9:

    ```tsx
    import { useTranslation } from 'react-i18next';
    import type { BuildingBlockType } from '@/lib/types';

    export interface PlaceholderBlockProps {
      type: BuildingBlockType;
    }

    export function PlaceholderBlock({ type }: PlaceholderBlockProps) {
      const { t } = useTranslation();
      const label = t(`editor.blockType.${camelCaseLabelKeyFor(type)}`);
      const a11yLabel = t('editor.placeholderBlockA11y', { type: label });
      return (
        <div
          role="note"
          aria-label={a11yLabel}
          className="rounded-sm border border-dashed border-border bg-muted/40 px-3 py-2 italic text-muted-foreground opacity-60"
        >
          [{label} — coming soon]
        </div>
      );
    }
    ```

    Define `camelCaseLabelKeyFor(type)` locally — e.g. `'SectionHeading' → 'sectionHeading'`, `'ChordTablatureGroup' → 'chordTablatureGroup'`. Export the helper for unit testing.

    Co-locate tests:
    - Renders italic muted text containing the resolved label and the literal "— coming soon" string.
    - `role="note"` and `aria-label` reflect the type.
    - Helper `camelCaseLabelKeyFor` correctly converts all 10 BuildingBlockType values (parameterized test).

    Use the in-repo i18next test setup. If a missing-key warning surfaces in tests, ensure plan 01-01's i18n keys are loaded.
  </action>
  <read_first>
    - .planning/phases/01-module-content-editor-core/01-UI-SPEC.md §4.9 (placeholder spec)
    - src/i18n/index.ts (test setup pattern for i18next)
    - src/components/ui/ (existing component conventions — className shape, Tailwind tokens)
  </read_first>
  <acceptance_criteria>
    - `test -f src/features/notebooks/blocks/PlaceholderBlock.tsx` exits 0
    - `grep -q "role=\"note\"" src/features/notebooks/blocks/PlaceholderBlock.tsx` exits 0
    - `grep -q "border-dashed" src/features/notebooks/blocks/PlaceholderBlock.tsx` exits 0
    - `pnpm test PlaceholderBlock` exits 0 with ≥ 4 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="3.3" type="tdd">
  <action>
    Create `src/features/notebooks/blocks/registry.ts`:

    ```ts
    import {
      Calendar, CheckSquare, Heading, List, ListOrdered,
      Music2, Music3, Music4, Table2, Type,
    } from 'lucide-react';
    import type { BuildingBlock, BuildingBlockType } from '@/lib/types';
    import type { BlockDescriptor } from './types';
    import { PlaceholderBlock } from './PlaceholderBlock';

    /** Build a placeholder-only descriptor for an unimplemented block type. */
    function placeholderDescriptor(
      type: BuildingBlockType,
      icon: BlockDescriptor['icon'],
      labelKey: string,
    ): BlockDescriptor {
      const Component: React.FC<{ block: BuildingBlock }> = () => <PlaceholderBlock type={type} />;
      return {
        Renderer: Component,
        Editor: Component,
        create: () => ({ type }),
        icon,
        labelKey,
        implemented: false,
      };
    }

    export const BLOCK_REGISTRY: Record<BuildingBlockType, BlockDescriptor> = {
      SectionHeading: placeholderDescriptor('SectionHeading', Heading, 'editor.blockType.sectionHeading'),
      Date: placeholderDescriptor('Date', Calendar, 'editor.blockType.date'),
      Text: placeholderDescriptor('Text', Type, 'editor.blockType.text'), // overridden in plan 01-04
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
    ```

    Co-locate tests at `registry.test.ts`:
    - Every value in the `BuildingBlockType` union has an entry in `BLOCK_REGISTRY` (parameterised over the 10 types).
    - `getBlockDescriptor('Text')` returns a descriptor whose `icon` is the Lucide `Type` component (compare reference identity).
    - `descriptor.create()` returns an object with `{ type: 'Text' }` for the `Text` entry; same shape for all other types.
    - `descriptor.Renderer` and `descriptor.Editor` render `PlaceholderBlock` for `implemented: false` entries (assert the rendered output contains the placeholder dashed-border class or the "coming soon" copy).
    - Compile-time exhaustiveness: a TypeScript expectation test that omitting a key from `BLOCK_REGISTRY` produces a compile error. Implement via a `// @ts-expect-error` comment in a guarded test fixture (see Vitest + tsd pattern, or use a simple `.test-d.ts` file if tsd is available; otherwise document the manual check).
  </action>
  <read_first>
    - src/lib/types/common.ts (BuildingBlockType — all 10 values must appear as keys)
    - src/features/notebooks/blocks/types.ts (BlockDescriptor — created in task 3.1)
    - src/features/notebooks/blocks/PlaceholderBlock.tsx (created in task 3.2)
    - .planning/phases/01-module-content-editor-core/01-UI-SPEC.md §8 (icon mapping)
  </read_first>
  <acceptance_criteria>
    - `grep -q "export const BLOCK_REGISTRY" src/features/notebooks/blocks/registry.ts` exits 0
    - `grep -q "Record<BuildingBlockType, BlockDescriptor>" src/features/notebooks/blocks/registry.ts` exits 0
    - `node -e "const r = require('fs').readFileSync('src/features/notebooks/blocks/registry.ts','utf-8'); const types = ['SectionHeading','Date','Text','BulletList','NumberedList','CheckboxList','Table','MusicalNotes','ChordProgression','ChordTablatureGroup']; for (const t of types) if (!r.includes(t + ':')) { console.error('Missing key:', t); process.exit(1); } process.exit(0)"` exits 0
    - `pnpm test registry` exits 0 with ≥ 5 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

## Verification

```bash
pnpm tsc --noEmit
pnpm test PlaceholderBlock registry
pnpm run lint
```

## Wave Notes

Wave 1, parallel-safe with 01-01 and 01-02. Plan 01-04 mutates `BLOCK_REGISTRY.Text` to point at the real Renderer/Editor and flips `implemented: true`.

