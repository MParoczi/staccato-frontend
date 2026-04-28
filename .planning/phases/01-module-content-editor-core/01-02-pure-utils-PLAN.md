---
plan_id: 01-02-pure-utils
phase: 1
phase_name: Module Content Editor (Core)
wave: 1
depends_on: []
requirements: [EDIT-01]
autonomous: true
files_modified:
  - src/features/notebooks/utils/text-spans.ts
  - src/features/notebooks/utils/text-spans.test.ts
  - src/features/notebooks/utils/edit-history.ts
  - src/features/notebooks/utils/edit-history.test.ts
  - src/features/notebooks/hooks/useDebouncedSave.ts
  - src/features/notebooks/hooks/useDebouncedSave.test.ts
  - src/features/notebooks/hooks/useEditHistory.ts
  - src/features/notebooks/hooks/useEditHistory.test.ts
must_haves:
  truths:
    - "splitSpansAtSelection and mergeAdjacentSpans are pure, deterministic, idempotent (merge), and never throw on legal inputs."
    - "Undo/redo reducer caps history at 50 entries (drops oldest) and clears `future` on every push."
    - "useDebouncedSave fires once after 1000 ms of quiet, exposes flush() and cancel(), and cleans up timers on unmount."
    - "Test coverage on these four modules is ≥ 80% lines (lifts global STAB-02 ≥ 60% gate)."
---

# Plan 01-02 — Pure utilities: TextSpan ops, undo reducer, debounced-save hook, history hook

<objective>
Build the four pure / hook-pure modules that contain all the math + timing of the editor. Heavy unit-test coverage on these contains the bug surface; later plans (TextSpanEditor, ModuleEditor) consume them as black boxes.
</objective>

## Tasks

<task id="2.1" type="tdd">
  <action>
    Create `src/features/notebooks/utils/text-spans.ts` and `text-spans.test.ts`. Implement and unit-test:

    ```ts
    import type { TextSpan } from '@/lib/types';

    /**
     * Split the span at array index `spanIndex` at character offset
     * `charOffset`, returning a new TextSpan[] with the same overall text
     * but a span boundary at the requested point. If the offset is 0 or
     * equal to the span's text length, the array is returned unchanged
     * (no zero-length span is produced).
     */
    export function splitSpanAt(spans: readonly TextSpan[], spanIndex: number, charOffset: number): TextSpan[];

    /**
     * Split spans so that the inclusive-exclusive range
     * [{anchorSpan, anchorOffset}, {focusSpan, focusOffset}) sits on
     * boundaries. Returns the new array AND the indices of the spans
     * that fall inside the resulting selection (so callers can flip
     * `bold` on them).
     */
    export function splitSpansAtSelection(
      spans: readonly TextSpan[],
      anchor: { spanIndex: number; charOffset: number },
      focus:  { spanIndex: number; charOffset: number },
    ): { spans: TextSpan[]; selectedIndices: number[] };

    /**
     * Collapse adjacent spans with identical `bold`. Drops zero-length
     * spans. Idempotent: `merge(merge(x))` deep-equals `merge(x)`.
     */
    export function mergeAdjacentSpans(spans: readonly TextSpan[]): TextSpan[];

    /** Total text length across spans (utility used by selection clamping). */
    export function totalLength(spans: readonly TextSpan[]): number;
    ```

    **Tests required (≥ 12 cases):**
    - `splitSpanAt`: split at 0 → unchanged; split at length → unchanged; split mid → 2 spans, both with original bold; split out-of-range index throws clearly.
    - `splitSpansAtSelection`: collapsed selection (anchor === focus) returns spans unchanged + empty `selectedIndices`; selection within one span produces 3-piece split (or 2-piece at boundary); selection across 3 spans correctly splits at both ends; reversed selection (focus before anchor) is normalised.
    - `mergeAdjacentSpans`: idempotent; drops zero-length entries; preserves order; preserves `bold` value of the survivor; empty input → empty output; single-element input unchanged.
    - `totalLength`: sums text lengths; empty array → 0.
  </action>
  <read_first>
    - src/lib/types/text-spans.ts (TextSpan interface — created in plan 01-01)
    - src/features/notebooks/utils/ (any existing utils — confirm folder exists)
  </read_first>
  <acceptance_criteria>
    - `test -f src/features/notebooks/utils/text-spans.ts` exits 0
    - `test -f src/features/notebooks/utils/text-spans.test.ts` exits 0
    - `grep -q "export function splitSpansAtSelection" src/features/notebooks/utils/text-spans.ts` exits 0
    - `grep -q "export function mergeAdjacentSpans" src/features/notebooks/utils/text-spans.ts` exits 0
    - `pnpm test text-spans` exits 0 with ≥ 12 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="2.2" type="tdd">
  <action>
    Create `src/features/notebooks/utils/edit-history.ts` and matching `edit-history.test.ts`. Implement a pure reducer:

    ```ts
    import type { BuildingBlock } from '@/lib/types';

    export interface HistoryState {
      past: BuildingBlock[][];
      present: BuildingBlock[];
      future: BuildingBlock[][];
    }

    export const HISTORY_CAP = 50;

    export type HistoryAction =
      | { type: 'push'; next: BuildingBlock[] }
      | { type: 'undo' }
      | { type: 'redo' }
      | { type: 'reset'; initial: BuildingBlock[] };

    export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState;

    export function initialHistory(initial: BuildingBlock[]): HistoryState;

    export function canUndo(state: HistoryState): boolean;
    export function canRedo(state: HistoryState): boolean;
    ```

    **Reducer rules:**
    - `push`: appends current `present` to `past`, sets new `present`, clears `future`. If `past.length` would exceed `HISTORY_CAP`, drop the oldest entry (`past.slice(1)`). No-op if `next` deep-equals `present` (avoid empty entries).
    - `undo`: pops from `past`, prepends current `present` to `future`, sets popped value as `present`. No-op if `past` is empty.
    - `redo`: shifts from `future`, appends current `present` to `past`, sets shifted value as `present`. No-op if `future` is empty.
    - `reset`: returns `initialHistory(action.initial)`.

    **Tests required (≥ 10 cases):**
    - `push` then `undo` round-trips to original `present`.
    - `push` × N (N > 50) caps `past.length` at 50.
    - `push` clears any accumulated `future`.
    - `undo` on empty `past` is a no-op (referentially equal? — at minimum value-equal).
    - `redo` after `undo` restores the post-push state.
    - `reset` clears both `past` and `future`.
    - `canUndo` / `canRedo` reflect stack non-emptiness.
    - Push of value deep-equal to present is a no-op (no entry added).
  </action>
  <read_first>
    - src/lib/types/modules.ts (BuildingBlock shape)
  </read_first>
  <acceptance_criteria>
    - `grep -q "export function historyReducer" src/features/notebooks/utils/edit-history.ts` exits 0
    - `grep -q "HISTORY_CAP = 50" src/features/notebooks/utils/edit-history.ts` exits 0
    - `pnpm test edit-history` exits 0 with ≥ 10 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="2.3" type="tdd">
  <action>
    Create `src/features/notebooks/hooks/useDebouncedSave.ts`. Modeled after the timer + snapshot pattern in `useModuleLayoutMutations.ts` (read first for the reference shape).

    ```ts
    import { useCallback, useEffect, useRef } from 'react';

    export interface UseDebouncedSaveOptions<T> {
      delayMs: number;
      onSave: (value: T) => Promise<unknown>;
    }

    export interface UseDebouncedSaveResult<T> {
      /** Schedule a save; coalesces with any prior pending call. */
      schedule: (value: T) => void;
      /** Fire any pending save NOW; returns the in-flight promise (or undefined if nothing pending). */
      flush: () => Promise<unknown> | undefined;
      /** Drop any pending save without firing. */
      cancel: () => void;
      /** True while the most recently dispatched save is in flight. */
      isSaving: () => boolean;
    }

    export function useDebouncedSave<T>(opts: UseDebouncedSaveOptions<T>): UseDebouncedSaveResult<T>;
    ```

    **Implementation rules:**
    - Refs (not state — avoids re-renders on every keystroke): `pendingTimer`, `pendingValue`, `inFlightPromise`.
    - `schedule(v)` stores `v` in `pendingValue`, clears any existing timer, starts a new one of `delayMs`. Timer callback clears the timer ref, captures the value, and invokes `onSave(value)`; resulting promise stored in `inFlightPromise`; cleared on settle.
    - `flush()` clears the timer, captures `pendingValue`, invokes `onSave` synchronously, returns its promise. If there's no pending value, returns `undefined`.
    - `cancel()` clears the timer and `pendingValue`.
    - `useEffect` cleanup clears the timer on unmount.
    - Use stable `useCallback` references for `schedule` / `flush` / `cancel` / `isSaving` so consumers can pass them as deps without re-creating handlers.

    Co-locate tests at `useDebouncedSave.test.ts` using `vi.useFakeTimers()`.

    **Tests required (≥ 8 cases):**
    - Single `schedule` → no save before delay; one save exactly at delay.
    - Burst of 5 `schedule` calls within delay → exactly one save after the last + delay (coalescing).
    - `flush()` when timer is pending → save fires immediately; no save fires after the original delay.
    - `flush()` with nothing pending → returns `undefined`, no save.
    - `cancel()` drops the pending save → no save ever fires.
    - Unmount with pending save → no save fires after unmount (timer cleared).
    - Save promise rejection: hook does NOT swallow — the rejection is propagated through `flush()`'s returned promise (consumer handles).
    - `isSaving()` returns `true` between dispatch and settle.
  </action>
  <read_first>
    - src/features/notebooks/hooks/useModuleLayoutMutations.ts (reference: `pendingTimers` ref, `runLayoutSave`, `flushPendingLayoutUpdates`, the `useEffect` cleanup at lines 288-296)
    - src/test-setup.ts (Vitest fake-timer setup)
  </read_first>
  <acceptance_criteria>
    - `grep -q "export function useDebouncedSave" src/features/notebooks/hooks/useDebouncedSave.ts` exits 0
    - `grep -q "vi.useFakeTimers" src/features/notebooks/hooks/useDebouncedSave.test.ts` exits 0
    - `pnpm test useDebouncedSave` exits 0 with ≥ 8 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="2.4" type="tdd">
  <action>
    Create `src/features/notebooks/hooks/useEditHistory.ts` — thin React wrapper around the reducer from task 2.2.

    ```ts
    export interface UseEditHistoryResult {
      present: BuildingBlock[];
      canUndo: boolean;
      canRedo: boolean;
      push: (next: BuildingBlock[]) => void;
      undo: () => void;
      redo: () => void;
      reset: (initial: BuildingBlock[]) => void;
    }

    export function useEditHistory(initial: BuildingBlock[]): UseEditHistoryResult;
    ```

    Use `useReducer(historyReducer, initial, initialHistory)`. Expose stable `useCallback` handlers. The 150 ms typing-burst coalescing (CONTEXT decision 3) is the consumer's responsibility — `useEditHistory` itself does not debounce.

    Co-locate tests with `@testing-library/react`'s `renderHook`.

    **Tests required (≥ 6 cases):**
    - Initial: `present` matches initial array; `canUndo` and `canRedo` are false.
    - `push` then `undo` returns to original `present`; `canRedo` flips to true.
    - `push` × 60 caps internal `past` at 50 (verify by undoing 51 times → final `present` is the 11th-from-last value, not the original).
    - `redo` after `undo` restores the pushed state.
    - `reset` clears history and updates `present`.
    - Stable refs: `result.current.push` reference does not change across re-renders triggered by other state changes (verify via `expect(handlerRef).toBe(handlerRef)` after a re-render).
  </action>
  <read_first>
    - src/features/notebooks/utils/edit-history.ts (the reducer from task 2.2)
    - src/test-setup.ts (renderHook setup)
  </read_first>
  <acceptance_criteria>
    - `grep -q "export function useEditHistory" src/features/notebooks/hooks/useEditHistory.ts` exits 0
    - `grep -q "useReducer" src/features/notebooks/hooks/useEditHistory.ts` exits 0
    - `pnpm test useEditHistory` exits 0 with ≥ 6 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

## Verification

```bash
pnpm tsc --noEmit
pnpm test text-spans edit-history useDebouncedSave useEditHistory
pnpm run lint
```

## Wave Notes

Wave 1, parallel-safe with 01-01 and 01-03. No imports from this plan are taken by 01-01 or 01-03 (the registry plan does NOT depend on these utils). Plans in wave 2 (`01-04-text-block`, `01-05-editor-shell`) consume all four modules created here.

