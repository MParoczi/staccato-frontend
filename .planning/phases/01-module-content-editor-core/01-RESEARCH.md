# Phase 1 — Module Content Editor (Core) — RESEARCH.md

*Created: 2026-04-28 by `/gsd-plan-phase 1`*
*Sources read: `01-CONTEXT.md`, `01-UI-SPEC.md`, ROADMAP.md (Phase 1), REQUIREMENTS.md (EDIT-01, STAB-02), `frontend-speckit-prompts.md` lines 1402–1547, `src/lib/types/{modules,common}.ts`, `src/api/modules.ts`, `src/features/notebooks/hooks/useModuleLayoutMutations.ts`, `src/features/styling/utils/module-type-config.ts`, codebase docs (STACK / ARCHITECTURE / STRUCTURE / CONVENTIONS / TESTING / INTEGRATIONS / CONCERNS).*

## Executive Summary

1. **All hard decisions are already locked in `01-CONTEXT.md`** — no design re-litigation needed. Research focuses on *how* to implement them safely.
2. **Reuse, don't reinvent.** `useModuleLayoutMutations.ts` is the canonical optimistic-update + debounce-with-flush pattern in this codebase. The new content-mutation hook clones that shape (timer Map, snapshot Map, `flushPending…`, cleanup `useEffect`) but targets `PUT /modules/{moduleId}` with the full module payload.
3. **`PUT /modules/{moduleId}` must be added** to `src/api/modules.ts`. The existing `updateModule` (PATCH) is left untouched — F9 prompt explicitly mandates a full-replace PUT for last-write-wins semantics; the existing PATCH is kept for callers that *do* want partial semantics (currently none in the active codebase).
4. **TextSpan editing uses `contentEditable` + `beforeinput` event** with manual `Selection`/`Range` bookkeeping. `document.execCommand` is deprecated and produces inconsistent DOM across browsers — we never call it. Two pure utilities (`splitSpansAtSelection`, `mergeAdjacentSpans`) absorb all state math; the React component only hosts the editable element + selection plumbing.
5. **Block reorder reuses `@dnd-kit/sortable`** which is already transitively available via `@dnd-kit/core` (the F8 grid is the parent DnD context — nesting a `SortableContext` inside an inactive grid sensor is supported per dnd-kit docs).
6. **Dirty-state guard uses `useBlocker` from React Router v7** (`react-router` ≥ 6.4 data router). The blocker resolves only after the in-flight save settles — implemented by awaiting the latest save promise inside the blocker callback.
7. **Editor surface is wrapped in `React.lazy()`** at the `ModuleEditor` boundary (not at the registry level) so the canvas-route initial chunk stays small. `Suspense` fallback inside the module wrapper is the placeholder block visual (avoids layout shift).
8. **Coverage strategy:** the four pure / hook-pure modules (`splitSpansAtSelection`, `mergeAdjacentSpans`, undo reducer, `useDebouncedSave`) target ≥ 80 % unit-test coverage to lift the global ≥ 60 % gate (STAB-02).

## Validation Architecture

This section is the Nyquist input — every Phase-1 acceptance criterion is mapped to a testable invariant and a verification command. The planner translates each row into a per-task `<acceptance_criteria>` block; the verifier re-runs the commands.

### Pure unit tests (Vitest, no React)

| Invariant | Test file | Verification |
| --- | --- | --- |
| `splitSpansAtSelection` splits a single span into 1–3 spans at exact offsets; preserves bold; never produces empty spans except at boundaries documented in the contract | `src/features/notebooks/utils/text-spans.test.ts` | `pnpm test text-spans` exits 0 |
| `mergeAdjacentSpans` collapses neighbours with identical `bold`; idempotent (`merge(merge(x)) === merge(x)`); preserves order; drops zero-length spans | same file as above | same |
| `MODULE_ALLOWED_BLOCKS` exhaustively keys every `ModuleType`; `Title` resolves to `['Date','Text']`; `Breadcrumb` resolves to `[]`; `FreeText` resolves to all 10 `BuildingBlockType` values | `src/features/notebooks/utils/module-allowed-blocks.test.ts` | `pnpm test module-allowed-blocks` exits 0 |
| Undo reducer: `push` adds to `past`, clears `future`; `undo` rotates `present` → `future`; `redo` rotates `future` → `present`; cap at 50 (drops oldest) | `src/features/notebooks/utils/edit-history.test.ts` | `pnpm test edit-history` exits 0 |
| Block-registry exhaustiveness — TS `Record<BuildingBlockType, BlockDescriptor>` compiles; missing key is a compile error (verified by removing one key in a sandboxed branch) | `src/features/notebooks/blocks/registry.test.ts` (compile-time check + spot runtime) | `pnpm tsc --noEmit` exits 0 |

### Hook tests (Vitest + `@testing-library/react`)

| Invariant | Test file | Verification |
| --- | --- | --- |
| `useDebouncedSave` fires once after 1000 ms of quiet; coalesces a typing burst into one call; `flush()` invokes immediately; `cancel()` drops pending; cleanup on unmount drops pending | `src/features/notebooks/hooks/useDebouncedSave.test.ts` | `pnpm test useDebouncedSave` exits 0 |
| `useEditHistory` (wrap of reducer): `Ctrl+Z` undoes, `Ctrl+Shift+Z` redoes, `Ctrl+Y` redoes on Windows, history cleared on `reset()` | `src/features/notebooks/hooks/useEditHistory.test.ts` | `pnpm test useEditHistory` exits 0 |
| `useModuleContentMutation` performs optimistic cache update against `pageModulesQueryKey`, fires `PUT /modules/{id}` on debounce trailing edge, restores snapshot on rejection, surfaces `INVALID_BUILDING_BLOCK` and `BREADCRUMB_CONTENT_NOT_EMPTY` server messages via toast | `src/features/notebooks/hooks/useModuleContentMutation.test.ts` | `pnpm test useModuleContentMutation` exits 0 |

### Component-integration tests (Vitest + RTL + MSW)

| Invariant | Test file | Verification |
| --- | --- | --- |
| Single-click on a *selected* module enters edit mode; double-click on an unselected module selects + enters; explicit Edit button (Enter / Space activates) enters edit mode | `src/features/notebooks/components/ModuleEditor.test.tsx` | `pnpm test ModuleEditor` exits 0 |
| Edit mode → typing in TextSpan editor → 1 s pause → MSW intercepts a `PUT /modules/{id}` with full payload including `content[0].spans` matching the typed text; cache reflects the saved module | same file | same |
| `Ctrl+B` toggles bold on selection; bold spans render with `font-weight: 700`; toolbar Bold toggle reflects `aria-pressed` | same | same |
| `Ctrl+Z` / `Ctrl+Shift+Z` undo + redo; capped at 50 entries | same | same |
| Block delete confirmation: empty block deletes silently; non-empty block opens AlertDialog whose Cancel default-focuses and whose Confirm fires deletion | same | same |
| `MODULE_ALLOWED_BLOCKS` enforced — Add Block popover for a `Title` module shows only Date + Text; for `Breadcrumb` the Add Block button is disabled | same | same |
| Breadcrumb module displays the auto-gen empty-state panel (per UI-SPEC §4.10) and never renders the block list | same | same |
| Save indicator transitions Idle → Saving → Saved → Idle (Saved fades after 1.5 s); on MSW failure transitions to Failed with destructive styling | same | same |
| Route-change while edit-mode is active AND last save failed opens the unsaved-changes AlertDialog; selecting "Discard changes" allows the navigation; selecting "Keep editing" cancels it | same | same |
| Click-outside the module flushes the pending save synchronously and exits edit mode silently (no dialog) | same | same |
| Round-trip: load a module with a `Text` block (spans = `[{text:'hi',bold:true}]`), edit nothing, exit, no PUT fires; edit one character, exit, PUT fires once with the edited spans, reload, content re-hydrates identically (pixel-stable in RTL) | same | same |

### Manual UAT (recorded in CHANGELOG, not gated automatically)

| Item | Verification |
| --- | --- |
| Edit-mode glow is the only accent visible on the active module; appears within 200 ms of entering edit mode; respects `prefers-reduced-motion` | Storybook story `ModuleEditor/EditModeGlow` + manual eye-test |
| Toolbar at smallest grid cell (≈ 280 px) collapses to icon-only; Add Block popover does not overflow the canvas | manual at zoom levels 75 % / 100 % / 125 % |
| Reduced motion: spinner becomes static dot; Saved fade is instant | manual with OS reduced-motion toggle |

## Implementation Notes

### 1. contentEditable selection + bold toggle
- Render TextSpan[] declaratively as `<span data-bold={bold}>{text}</span>` chain inside one `<div contentEditable>`. Bold spans get `font-weight:700` via CSS attribute selector — no nested `<strong>` needed (avoids selection-collapse bugs on Firefox).
- Subscribe to `beforeinput` (preferred over `input` because it gives us `inputType` + `getTargetRanges()` *before* the DOM mutates) — most cases let the browser apply the change, then reconcile our `TextSpan[]` model from the resulting text on `input`. For `inputType === 'historyUndo'/'historyRedo'` we `preventDefault()` and route through our own undo stack.
- IME composition: ignore `beforeinput` between `compositionstart` and `compositionend`; on `compositionend`, snapshot the resulting text, run `splitSpansAtSelection` once.
- Paste handler: `onPaste` calls `preventDefault()` and inserts `event.clipboardData.getData('text/plain')` only — kills paste-from-Word HTML poisoning (XSS mitigation). No `innerHTML` ever assigned.
- Bold toggle: read `window.getSelection()`; if collapsed, set component-state `pendingBold` flag — next typed char inserts a span with `bold: pendingBold`. If non-collapsed, call `splitSpansAtSelection` then flip `bold` on the affected indices, then `mergeAdjacentSpans`.
- Focus restoration: after React commits, restore selection by walking the rendered span chain to the saved `(spanIndex, charOffset)` pair. Encapsulated in `restoreSelection()` helper.

### 2. Optimistic mutation + debounce + flush
- Clone the shape of `useModuleLayoutMutations.scheduleLayoutUpdate` / `flushPendingLayoutUpdates`. Two refs: `pendingTimer: NodeJS.Timeout | null` (single-module debounce — only one module ever edited at once) and `pendingSnapshot: Module | undefined` (pre-edit module for rollback).
- `flushPendingSave()` clears the timer and invokes the mutation **synchronously** (returns the in-flight promise). Wired to: click-outside, Escape, explicit Save, `useBlocker` proceed.
- React 19 strict-mode double-invoke: timers in `useRef` survive re-mount in strict-mode dev builds because cleanup `useEffect` clears them — same pattern as the layout hook (see lines 288–296 of `useModuleLayoutMutations.ts`).

### 3. React Router v7 `useBlocker`
- API: `const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && lastSaveFailed);` returns `{ state: 'unblocked' | 'blocked' | 'proceeding', proceed(), reset() }`.
- When `blocker.state === 'blocked'`, render the unsaved-changes AlertDialog. Cancel → `blocker.reset()`. Discard → `blocker.proceed()`.
- "Last save failed" comes from the mutation's `error` state. If a save is *currently in flight* when navigation is attempted, await it (`await flushPendingSave()`) inside the blocker callback before deciding.
- Programmatic `navigate(...)`, `<Link>` clicks, and browser back/forward all funnel through the blocker. Closing the tab does NOT (no `beforeunload` per CONTEXT decision 4).

### 4. Block registry shape
```ts
// src/features/notebooks/blocks/registry.ts
import type { BuildingBlock, BuildingBlockType } from '@/lib/types';

export interface BlockDescriptor {
  Renderer: React.FC<{ block: BuildingBlock }>;
  Editor: React.FC<{ block: BuildingBlock; onChange: (next: BuildingBlock) => void }>;
  /** Default block factory invoked by Add Block popover. */
  create: () => BuildingBlock;
  /** Lucide icon component used in Add Block popover (UI-SPEC §8). */
  icon: LucideIcon;
  /** i18n key for label. */
  labelKey: string;
}

export const BLOCK_REGISTRY: Record<BuildingBlockType, BlockDescriptor> = {
  Text: TextBlockDescriptor,
  SectionHeading: placeholder('SectionHeading', 'Heading', 'editor.blockType.sectionHeading'),
  // …all 10 keys, exhaustively
};
```
Compile-time exhaustiveness via `Record<BuildingBlockType, …>` — TS errors if a key is missed.

### 5. `@dnd-kit/sortable` for vertical block list
- `<SortableContext items={block.id-or-index} strategy={verticalListSortingStrategy}>` wrapping the block list.
- Each block uses `useSortable({ id })` and applies `transform`/`transition` to its outer div.
- Sensors: `PointerSensor` (8 px activation distance) + `KeyboardSensor` (custom keyCodes for a11y per UI-SPEC §6).
- Nesting under the F8 grid DnD: F8's `DndContext` is at the canvas level; ours is at the module level. dnd-kit supports nested contexts as long as their sensors don't both consume the same pointer — we set our `activationConstraint` so the outer grid drag wins on the module *body* but our sortable wins on the drag handle (use a dedicated handle element with `setActivatorNodeRef`).

### 6. `React.lazy` boundary
- `ModuleEditor` is the lazy module: `const ModuleEditor = React.lazy(() => import('./ModuleEditor'));`.
- `<Suspense fallback={<EditorLoadingShell />}>` wraps it inside `ModuleCard` — `EditorLoadingShell` matches the module's grid dimensions exactly so no layout shift on hydration.
- The view-mode renderer (`BlockListRenderer`) is **not** lazy — it has to be in the canvas chunk because every module renders in view mode by default.

## Threat Model

| Threat | Severity | Mitigation |
| --- | --- | --- |
| XSS via paste-from-clipboard HTML | High | `onPaste` calls `preventDefault()` + inserts `text/plain` only. No `innerHTML` ever set. |
| XSS via crafted `Module.content` (server-controlled string injected into `font-weight` etc.) | Medium | Render TextSpan declaratively as JSX text nodes; `bold` becomes a boolean `data-bold` attribute, never a style string. Zod-validate the response shape (`buildingBlockSchema`) before placing into cache. |
| Stale optimistic cache after server reject | Medium | `pendingSnapshot` ref captures pre-edit module; rollback restores it on rejection (mirrors `useModuleLayoutMutations`). |
| Concurrent saves racing (text edit + reorder firing within 1 s) | Low | Single shared `useDebouncedSave` per active module — only one in-flight PUT at a time. New save during in-flight: queue (don't overlap); flush triggers on settle. |
| Token leakage in error messages | Low | Existing axios interceptor already strips auth from error payloads — we reuse it. |
| 422 `INVALID_BUILDING_BLOCK` | n/a (UX) | Translate via `react-i18next`, surface as toast; cache rolls back to pre-edit snapshot. |
| 422 `BREADCRUMB_CONTENT_NOT_EMPTY` | n/a (UX) | Defense-in-depth: Breadcrumb modules never render the block list (UI-SPEC §4.10), so the request should never go out. If it does (programmatic mutation), translate + toast + rollback. |
| Lost edits on tab close | Accepted | No `beforeunload` per CONTEXT decision 4 — autosave + 1 s debounce is the safety net. Documented in user-facing help. |
| CSRF | n/a | Existing `withCredentials: true` axios client + backend cookie scoping covers it (AUTH-03). |

ASVS L1 covered: input validation (Zod on response), output encoding (declarative JSX, no `dangerouslySetInnerHTML`), no SSRF surface added, no new auth surface added.

## STAB-02 Hooks

- **a11y:** explicit Edit button, drag handle keyboard sensor, delete-button `aria-label`, AlertDialog focus trap, save indicator `role="status"` / `role="alert"` — all locked in UI-SPEC §6. `eslint-plugin-jsx-a11y` will pass on every new file.
- **Coverage:** four pure / hook-pure modules target ≥ 80 % to lift the global ≥ 60 % gate. New files contribute ~600–800 lines; tests contribute ~500 lines.
- **Code-splitting:** `ModuleEditor` is `React.lazy()`'d — first measurable bundle savings against the canvas route.
- **MSW (deferred):** Phase 1 introduces the first integration tests that benefit from MSW. We add the minimal handlers + `setupServer()` wiring in `src/test-setup.ts` only if tests actually need them; otherwise we defer the full STAB-02 MSW plumbing to a later phase.

## Open Questions for Planner

None. CONTEXT decisions 1–6 + locked cross-cutting details + UI-SPEC fully define the surface. Implementation specifics (file paths, hook names, test commands) are settled above.

## References

- React 19 docs — [Reusing logic with custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- TanStack Query v5 — [Optimistic Updates](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates)
- React Router v7 — [`useBlocker`](https://reactrouter.com/en/main/hooks/use-blocker)
- dnd-kit — [Sortable](https://docs.dndkit.com/presets/sortable), [nested contexts](https://docs.dndkit.com/api-documentation/sensors)
- MDN — [`beforeinput` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforeinput_event), [Selection API](https://developer.mozilla.org/en-US/docs/Web/API/Selection)
- Codebase — `src/features/notebooks/hooks/useModuleLayoutMutations.ts` (canonical optimistic+debounce pattern)
- Codebase — `src/features/styling/utils/module-type-config.ts` (canonical home for `MODULE_ALLOWED_BLOCKS`)
- Codebase — `src/components/ui/alert-dialog.tsx` (existing AlertDialog primitive)
- Codebase docs — `.planning/codebase/{ARCHITECTURE,STRUCTURE,CONVENTIONS,TESTING}.md`

## RESEARCH COMPLETE
Phase 1 research grounded in CONTEXT-locked decisions and the canonical optimistic-mutation pattern from `useModuleLayoutMutations`. Validation Architecture defines 30+ testable invariants across pure / hook / component layers; threat model covers XSS, cache poisoning, race, and 422 paths. Ready for planning.

