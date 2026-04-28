---
plan_id: 01-03-block-registry
phase: 1
phase_name: Module Content Editor (Core)
status: complete
completed: 2026-04-28
requirements: [EDIT-01]
key-files:
  created:
    - src/features/notebooks/blocks/types.ts
    - src/features/notebooks/blocks/block-labels.ts
    - src/features/notebooks/blocks/PlaceholderBlock.tsx
    - src/features/notebooks/blocks/PlaceholderBlock.test.tsx
    - src/features/notebooks/blocks/registry.ts
    - src/features/notebooks/blocks/registry.test.tsx
commits:
  - a945812 feat(01-03): add BlockDescriptor type-level contract for block registry
  - fee0b2c feat(01-03): add PlaceholderBlock + camelCaseLabelKeyFor helper
  - 4cc4ab1 feat(01-03): seed BLOCK_REGISTRY with placeholder descriptors for all 10 BuildingBlockTypes
---

# 01-03 — Block Registry Framework + Placeholder Block

## What was built

Seeded the plugin contract every block type must satisfy and shipped the
"coming soon" placeholder UI for the 9 unimplemented block types. Plan 01-04
will swap the `Text` entry for the real Renderer/Editor.

### Task 3.1 — `BlockDescriptor` type contract
- `src/features/notebooks/blocks/types.ts`
- Exports `BlockRendererProps`, `BlockEditorProps`, `BlockDescriptor`.
- `BlockDescriptor` shape: `{ Renderer, Editor, create, icon, labelKey, implemented }`.
- `implemented: boolean` flag drives the placeholder fallback today; plans 01-04+
  flip it to `true` per block as the real implementations land.

### Task 3.2 — `PlaceholderBlock` + helper
- `src/features/notebooks/blocks/PlaceholderBlock.tsx` — renders the UI-SPEC §4.9
  italic muted dashed-border note with `role="note"` and an aria-label sourced
  from `editor.placeholderBlockA11y` (interpolated with the block-type label).
- `src/features/notebooks/blocks/block-labels.ts` — pure helper
  `camelCaseLabelKeyFor(type)` mapping `'SectionHeading' → 'sectionHeading'`,
  `'ChordTablatureGroup' → 'chordTablatureGroup'`, etc. Extracted into a
  separate module so the `react-refresh/only-export-components` rule stays clean
  on `PlaceholderBlock.tsx`.
- 24 tests covering all 10 BuildingBlockTypes (no-throw guarantee), mapping
  correctness, role/aria-label, and dashed-border / italic / muted classes.

### Task 3.3 — `BLOCK_REGISTRY`
- `src/features/notebooks/blocks/registry.ts` — `Record<BuildingBlockType,
  BlockDescriptor>` typed registry with all 10 union members (compile-error if
  any key is missing). Each entry is currently a placeholder descriptor whose
  Renderer and Editor delegate to `PlaceholderBlock`.
- Lucide icons mapped per UI-SPEC §8: `Heading, Calendar, Type, List, ListOrdered,
  CheckSquare, Table2, Music2, Music3, Music4`.
- `getBlockDescriptor(type)` lookup helper throws on unknown keys
  (defense-in-depth alongside the `Record<>` exhaustiveness).
- 45 tests covering: per-type entry presence, icon reference identity,
  `create()` shape, `implemented === false` for all entries, Renderer/Editor
  fallback to PlaceholderBlock, exhaustive key set (no extras / no omissions),
  `getBlockDescriptor` happy-path and throw-path.

## Self-Check: PASSED

| Acceptance criterion | Result |
|----|----|
| 3.1 — `types.ts` exists, exports `BlockDescriptor`, has `implemented: boolean`, `pnpm tsc --noEmit` clean | ✓ |
| 3.2 — `PlaceholderBlock.tsx` exists, has `role="note"` + `border-dashed`, `pnpm test PlaceholderBlock` ≥ 4 (24 pass), `pnpm tsc --noEmit` clean | ✓ |
| 3.3 — `registry.ts` exports `BLOCK_REGISTRY` typed `Record<BuildingBlockType, BlockDescriptor>` with all 10 keys, `pnpm test registry` ≥ 5 (45 pass), `pnpm tsc --noEmit` clean | ✓ |

## Verification commands run

```text
pnpm tsc --noEmit                                          # clean
pnpm test --run src/features/notebooks/blocks/             # 2 files, 69 tests passed
pnpm run lint                                              # no findings in new files
```

## Notable deviations from plan

- The plan instructed that the helper `camelCaseLabelKeyFor` be exported from
  `PlaceholderBlock.tsx`. The repo's `react-refresh/only-export-components` rule
  forbids non-component exports from `.tsx` component files, so the helper was
  extracted to a sibling module `block-labels.ts`. The rest of the contract
  (testable helper, same signature, same behaviour) is unchanged.
- The plan listed `registry.test.ts` and `PlaceholderBlock.test.ts` in
  `files_modified`. Because both test files render JSX, they are committed as
  `*.test.tsx` (matching the repo's existing convention in
  `src/features/notebooks/components/`).

## What this enables

- Plan 01-04 (`Text` block) can mutate `BLOCK_REGISTRY.Text` to point at the
  real TextSpan-aware Renderer/Editor and flip `implemented: true`.
- Plan 01-05 (editor shell) can drive the Add Block popover, drag-handle
  rendering, and the per-block Renderer/Editor switching off `BLOCK_REGISTRY`
  alone — no per-type switch statements needed elsewhere.

## Phase 1 progress: 3/6 plans complete (Wave 1 done)

Wave 1: 01-01 ✓ · 01-02 ✓ · 01-03 ✓
Wave 2: 01-04 (Text block), 01-05 (editor shell) — pending
Wave 3: 01-06 (integration) — pending

