---
plan_id: 01-01-foundation
phase: 1
phase_name: Module Content Editor (Core)
wave: 1
status: complete
requirements: [EDIT-01]
completed_at: 2026-04-28
---

# 01-01 Foundation — SUMMARY

Established the immovable substrate every later Phase 1 plan depends on: the
`PUT /modules/{moduleId}` API client, the canonical `TextSpan` type, the
`MODULE_ALLOWED_BLOCKS` whitelist with its `isBlockAllowed` guard, and the
35 locked editor i18n keys in both EN and HU.

## What was built

| Task | Output | Status |
|------|--------|--------|
| 1.1  | `updateModuleFull(moduleId, payload)` PUT client in `src/api/modules.ts` | ✓ |
| 1.2  | `TextSpan` type + `isTextSpan` guard in `src/lib/types/text-spans.ts`; barrel re-export in `src/lib/types/index.ts` | ✓ |
| 1.3  | `MODULE_ALLOWED_BLOCKS` constant + `isBlockAllowed` helper in `src/features/styling/utils/module-type-config.ts`; **26 new tests** (50 total in this file) | ✓ |
| 1.4  | 35 `editor.*` i18n keys added to `src/i18n/en.json` + `src/i18n/hu.json` (≥ 30 required) | ✓ |

## Key files

### Created
- `src/lib/types/text-spans.ts`

### Modified
- `src/api/modules.ts` — `updateModuleFull` added; `updateModule` (PATCH) preserved; `ModuleType` import added.
- `src/lib/types/index.ts` — `TextSpan` and `isTextSpan` re-exported.
- `src/features/styling/utils/module-type-config.ts` — `MODULE_ALLOWED_BLOCKS` constant + `isBlockAllowed` helper added; existing exports untouched.
- `src/features/styling/utils/module-type-config.test.ts` — 26 new test cases under `describe('MODULE_ALLOWED_BLOCKS')` and `describe('isBlockAllowed')`.
- `src/i18n/en.json` — `editor` namespace expanded to the locked UI-SPEC §9 copy (35 keys).
- `src/i18n/hu.json` — same, with locked HU translations including diacritics (`Mentés`, `Visszavonás`, `Félkövér`, etc.).

## Truths established

- **`PUT /modules/{moduleId}`** accepts `{moduleType, gridX, gridY, gridWidth, gridHeight, zIndex, content}` and is the last-write-wins persistence path for the editor (Plans 01-02..01-06 will call it via the debounced-save hook).
- **`TextSpan`** is `{text: string, bold: boolean}` and is exported from `@/lib/types`. Every text-bearing block in this and future phases stores `spans: TextSpan[]` on its `BuildingBlock`.
- **`MODULE_ALLOWED_BLOCKS`** is exhaustively keyed by `ModuleType`. `Title=['Date','Text']`, `Breadcrumb=[]`, `FreeText` = all 10 block types, plus the 9 other module-type mappings from the F9 prompt.
- **30+ i18n keys exist in both locales** (35 actual). All keys from UI-SPEC §9.2–9.6 are present verbatim.

## Verification

| Gate | Result |
|------|--------|
| `node -e "JSON.parse(...en.json)"` | exit 0 (VALID) |
| `node -e "JSON.parse(...hu.json)"` | exit 0 (VALID) |
| `editor.*` key count en / hu | 35 / 35 (≥30 required) |
| `pnpm tsc --noEmit` | exit 0 (no errors) |
| `pnpm vitest run module-type-config.test.ts` | **50/50 pass** (24 existing + 26 new) |
| `pnpm run lint` | 0 errors, 1 pre-existing warning in `.github/get-shit-done/bin/lib/state.cjs` (not part of this plan) |
| All grep acceptance criteria | ✓ all pass (see Self-Check) |

### Pre-existing test failures (unrelated)

Running the full `pnpm test` surfaces 72 failing tests across 17 files
(StyleEditorDrawer, AvatarUploader, etc.) caused by MSW
`onUnhandledRequest: error` strategy bites — these existed on
`42679bb` before this plan and are not introduced by 01-01. Plan 01-01
modifies only API client / types / config / i18n; none of the failing
files import from these surfaces in a way that would have been newly broken.
The targeted gates the plan calls for (tsc, module-type-config tests, lint)
all pass cleanly.

## Deviations

1. **Commit granularity for tasks 1.1 and 1.2.** The new file
   `src/lib/types/text-spans.ts` was auto-staged on creation by the editor
   tooling, so it landed in the task-1.1 commit (`4b85292`) instead of a
   pure task-1.2 commit. The task-1.2 commit (`1a2447b`) contains only the
   barrel re-export. Net effect on the codebase is identical to the plan;
   only the boundary between the two commits drifted by one file.
2. **`editor.blocks.addBlock` preserved.** The plan implies replacing the
   existing minimal `editor` namespace (which had `editor.blocks.addBlock`
   with no callers found via grep). Out of caution it was kept in place
   alongside the new `editor.addBlock`. Safe to remove later if confirmed
   unused.

## Self-Check: PASSED

All 14 acceptance criteria across the 4 tasks pass:

- `grep -q "export async function updateModuleFull" src/api/modules.ts` → 0
- `grep -q 'apiClient\.put<Module>' src/api/modules.ts` → 0
- `grep -c 'export async function updateModule\(' src/api/modules.ts` → **1** (PATCH preserved)
- `test -f src/lib/types/text-spans.ts` → 0
- `grep -q "export interface TextSpan" src/lib/types/text-spans.ts` → 0
- `grep -q "isTextSpan" src/lib/types/text-spans.ts` → 0
- `grep -q "TextSpan" src/lib/types/index.ts` → 0
- `grep -q "export const MODULE_ALLOWED_BLOCKS" .../module-type-config.ts` → 0
- `grep -q "export function isBlockAllowed" .../module-type-config.ts` → 0
- `pnpm vitest run module-type-config` → **50/50 pass** (≥5 required)
- `pnpm tsc --noEmit` → 0
- `pnpm run lint` → 0 errors
- `node -e "JSON.parse(en.json)"` / `JSON.parse(hu.json)` → 0
- `editor.*` keys ≥ 30 in both locales → 35 each

## Commits

| SHA | Subject |
|-----|---------|
| `4b85292` | feat(01-01): add updateModuleFull PUT client for module content editor |
| `1a2447b` | feat(01-01): export TextSpan type from barrel |
| `fde1ee9` | feat(01-01): add MODULE_ALLOWED_BLOCKS + isBlockAllowed with exhaustive tests |
| `7b32ea2` | feat(01-01): add 33 editor.* i18n keys (en + hu) from UI-SPEC §9 |

## Hand-off to Wave 1 / Wave 2 plans

- `01-02-pure-utils` can now `import type { TextSpan }` from `@/lib/types` for its splitSpansAtSelection / mergeAdjacentSpans utilities.
- `01-03-block-registry` can now key its registry off `BuildingBlockType` and import `MODULE_ALLOWED_BLOCKS` / `isBlockAllowed` for the Add Block popover gate.
- `01-04-text-block` and `01-05-editor-shell` can rely on the i18n keys being present (no per-plan i18n additions needed for chrome).
- `01-06-integration` will wire `updateModuleFull` into the editor's debounced-save hook.

