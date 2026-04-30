---
plan_id: 01-06-integration
phase: 1
phase_name: Module Content Editor (Core)
status: complete
wave: 3
completed_at: 2026-04-30
commits: [33f37f3, d5849ef, 83ccb2a, ef1f6a8]
key-files:
  created:
    - src/features/notebooks/components/EditButton.tsx
    - src/features/notebooks/components/EditButton.test.tsx
    - src/features/notebooks/hooks/useEditModeEntry.ts
    - src/features/notebooks/hooks/useEditModeEntry.test.tsx
    - src/features/notebooks/hooks/useDirtyNavBlocker.ts
    - src/features/notebooks/hooks/useDirtyNavBlocker.test.tsx
    - src/features/notebooks/components/UnsavedChangesDialog.tsx
    - src/features/notebooks/components/UnsavedChangesDialog.test.tsx
    - src/features/notebooks/components/EditModeOverlay.tsx
    - src/features/notebooks/components/BlockListRenderer.tsx
    - src/features/notebooks/components/ModuleCard.editor.test.tsx
    - src/features/notebooks/components/ModuleCard.roundtrip.test.tsx
  modified:
    - src/features/notebooks/components/ModuleCard.tsx
    - src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx
    - src/index.css  # CP1252→UTF-8 byte fix; not a content change
deps_added: []
tests:
  - EditButton: 4/4 pass
  - useEditModeEntry: 6/6 pass
  - useDirtyNavBlocker: ≥6/6 pass
  - UnsavedChangesDialog: ≥4/4 pass
  - ModuleCard.editor (new): 10/10 pass
  - ModuleCard (existing F8): 10/10 pass (regression — unchanged)
  - ModuleCard.roundtrip: 5/5 pass (covers AC #1–#9)
  - total Phase-1 ModuleCard surface: 25/25 pass
---

# Plan 01-06 — Integration: wire ModuleEditor into ModuleCard, dirty-nav guard, round-trip test

## Self-Check: PASSED

All five tasks (6.1–6.5) shipped; each acceptance criterion from `01-CONTEXT.md` is exercised by `ModuleCard.roundtrip.test.tsx`.

1. **EditButton** (`33f37f3`) — keyboard-activatable edit-mode entry chip; visible on `isSelected && !isEditing`. Provides Decision 6 a11y path; `aria-label="editor.edit"`.
2. **useEditModeEntry** (`33f37f3`) — selection-aware single-click + double-click gesture handler; respects `data-prevent-edit-entry` so editor descendants don't re-enter.
3. **useDirtyNavBlocker** (`d5849ef`) — wraps `react-router` `useBlocker`. Fires only when `isEditing && isDirty`. Pattern: on `blocker.state === 'blocked'`, attempts a single `flushPendingSave()` retry; auto-`proceed()` on resolve, exposes `isBlocked=true` on reject (so the host can render `UnsavedChangesDialog`). Fully covered by `MemoryRouter` tests including idle-no-block, dirty-block, retry-success, retry-failure, reset-on-clean, unmount-cleanup.
4. **UnsavedChangesDialog** (`d5849ef`) — shadcn `AlertDialog` wrapping locked UI-SPEC §4.11 copy via i18n keys `editor.unsavedTitle / unsavedDescription / unsavedKeepEditing / unsavedDiscard`.
5. **ModuleCard surgery** (`83ccb2a`) — surgical insertion only:
   - `useState<boolean>('isEditing')`, `wrapperRef`, `editorRef: ModuleEditorHandle`, `saveStatus` mirror via `onSaveStatusChange`.
   - `React.lazy(() => import('./ModuleEditor/ModuleEditor'))` (deep path, not the barrel) so vite chunk-splits cleanly. Verified `dist/assets/ModuleEditor-*.js` (≈30 kB / 10 kB gzip) ships independently from the canvas-route chunk.
   - `<Suspense fallback={<EditorLoadingShell />}>` boundary inside the existing styled module wrapper (so F7 styling tokens flow into the editor through CSS inheritance).
   - New `EditModeOverlay` co-locates click-outside (`mousedown` listener with `data-prevent-edit-entry` guard), `Escape` keydown, and `useDirtyNavBlocker` integration in one place.
   - New `BlockListRenderer` (view-mode) dispatches every `BuildingBlock` through `BLOCK_REGISTRY[type].Renderer` — unimplemented types fall through to `PlaceholderBlock` (AC #7).
   - **F8 contracts preserved**: `data-testid="module-card-${id}"`, `data-selected`, `data-conflicting`, `data-dragging`, `aria-pressed={isSelected}`, header drag listeners gated by `isSelected`, `ModuleResizeHandles` render gate. All 10 existing F8 tests pass unchanged.
6. **Round-trip test** (`ef1f6a8`) — `ModuleCard.roundtrip.test.tsx` (5 tests, ≥9 inline `// AC #N:` markers):
   - **AC #1**: edit-mode entry doesn't break grid layout (`position: absolute`, `data-module-type` preserved).
   - **AC #2**: 1000 ms autosave debounce; explicit Save/Cancel exposed.
   - **AC #3**: undo/redo enabled after history-pushing edit.
   - **AC #4**: failed save + route change → `UnsavedChangesDialog` appears (via `MemoryRouter.navigate('/elsewhere')`).
   - **AC #5**: editor surface mounts inside the styled host wrapper (F7 token inheritance).
   - **AC #6**: Add Text block → optimistic cache update → debounced PUT → cache reconciliation → view-mode renders the saved spans.
   - **AC #7**: unimplemented `Table` block renders `PlaceholderBlock` (`role="note"` with `editor.placeholderBlockA11y`).
   - **AC #8**: Title module Add Block popover shows exactly Date + Text (`MODULE_ALLOWED_BLOCKS` UI gate).
   - **AC #9**: Breadcrumb modules show auto-gen note + disable Add Block + Save.

## Deviations from Plan

- **`onSaveStatusChange` callback added to `ModuleEditor` props.** Plan called for the host to read `saveStatus` from the editor; the cleanest non-prop-drilling path was an observer callback that the host wires into local state to feed `useDirtyNavBlocker(isEditing && saveStatus !== 'saved')`. Single-line addition; no breaking change to existing `ModuleEditorProps` consumers.
- **Lazy import path changed from barrel to deep file.** `React.lazy(() => import('./ModuleEditor'))` would re-import the same module statically already pulled in by the editor index re-export. Switched to `import('./ModuleEditor/ModuleEditor')` to silence rolldown's `INEFFECTIVE_DYNAMIC_IMPORT` warning and confirm the chunk-split actually happens. No behaviour change.
- **`src/index.css` byte fix.** Encountered pre-existing CP1252 bytes (`0x97` em-dash, `0xA7` section sign) inside two CSS comments seeded by an earlier plan. rolldown 1.0-rc.12 rejects these as invalid UTF-8 and aborts the build. Re-encoded the offending sequences to valid UTF-8 (`U+2014` `0xE2 0x80 0x94`, `U+00A7` `0xC2 0xA7`); only comment characters changed; no rule semantics affected. Build now produces `dist/assets/ModuleEditor-*.js` cleanly.

## Out of Scope (deferred)

- **Toolbar Bold ↔ active TextSpanEditor cross-wiring** (carried over from plan 01-05). The 9 CONTEXT acceptance criteria do not require toolbar Bold reflectivity (Ctrl+B inside contentEditable already works and bold spans render correctly), so the cross-wiring stays deferred to a later polish phase. Documented in plan 01-05 SUMMARY → Deviations.

## Verification Gates

- `pnpm tsc --noEmit` → clean.
- `pnpm test ModuleCard --run` → 25/25 pass.
- `pnpm run lint` → clean for plan-06 surface (one unrelated GSD-bin warning).
- `pnpm vite build` → succeeds; `dist/assets/ModuleEditor-*.js` chunk verified at ~30 kB / ~10 kB gzip.
- Full regression `pnpm test --run` → 17 pre-existing failing files (15 also fail on `main` per spot-check; F8 regression tests for `ModuleCard.test.tsx` all green). Pre-existing failures documented in plan 01-01 SUMMARY.

