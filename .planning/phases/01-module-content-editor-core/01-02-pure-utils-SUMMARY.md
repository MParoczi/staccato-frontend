# Plan 01-02 — Pure utilities (TextSpan ops, undo reducer, debounced-save hook, history hook) — SUMMARY

**Phase:** 1 — Module Content Editor (Core)
**Plan:** 01-02-pure-utils
**Wave:** 1 (Foundation utilities, parallel-safe with 01-01 and 01-03)
**Status:** ✓ Complete
**Date:** 2026-04-28

## Self-Check: PASSED

All four `must_haves.truths` verified:

1. ✓ `splitSpansAtSelection` and `mergeAdjacentSpans` are **pure, deterministic**, never mutate inputs, never throw on legal inputs (RangeError only on out-of-range positions, as documented in `<acceptance_criteria>`). `mergeAdjacentSpans` is **idempotent** — verified by direct test (`merge(merge(x))` deep-equals `merge(x)`).
2. ✓ Undo/redo reducer caps `past` at `HISTORY_CAP = 50`, drops the oldest snapshot on overflow (`past.slice(1).concat([present])`), and clears `future` on every `push` action. Verified by 60-push test (oldest retained snapshot is the 11th, confirming 0..9 were dropped).
3. ✓ `useDebouncedSave` fires once after 1000 ms of quiet (verified at 999 ms = no fire, 1000 ms = exactly one fire), exposes `flush()` (synchronous fire + cancel pending), `cancel()` (drop pending), `isSaving()`. Cleans up its timer on unmount (verified by mount → schedule → unmount → no fire after 5000 ms).
4. ✓ Test coverage on these four modules is concentrated and exhaustive: **50 new tests, all passing**, all dimensions of behaviour covered (split/merge/totalLength edge cases, reducer LIFO walk + cap + dedupe, hook timer coalescing, hook stability across re-renders).

## Acceptance criteria

| Task | Criteria | Status |
|---|---|---|
| 2.1 | `text-spans.{ts,test.ts}` exist; exports `splitSpansAtSelection`, `mergeAdjacentSpans`; `pnpm test text-spans` ≥ 12 tests | ✓ 23 tests pass |
| 2.2 | `edit-history.{ts,test.ts}` exist; exports `historyReducer`; `HISTORY_CAP = 50`; `pnpm test edit-history` ≥ 10 tests | ✓ 11 tests pass |
| 2.3 | `useDebouncedSave.{ts,test.ts}` exist; uses `vi.useFakeTimers`; `pnpm test useDebouncedSave` ≥ 8 tests | ✓ 9 tests pass |
| 2.4 | `useEditHistory.{ts,test.ts}` exist; uses `useReducer`; `pnpm test useEditHistory` ≥ 6 tests | ✓ 7 tests pass |
| All | `pnpm tsc --noEmit` exits 0 | ✓ Clean |
| All | `pnpm run lint` exits 0 (project files) | ✓ Clean (1 pre-existing warning in `.github/get-shit-done/bin/lib/state.cjs`, unrelated to phase 1) |

## Key files created

- `src/features/notebooks/utils/text-spans.ts` — `splitSpanAt`, `splitSpansAtSelection` (range-normalised, returns selectedIndices), `mergeAdjacentSpans` (drops zero-length, idempotent), `totalLength`.
- `src/features/notebooks/utils/text-spans.test.ts` — 23 cases: collapsed selection, single-span split (3-piece + 2-piece-at-boundary), 3-span split, reversed selection normalisation, mergeAdjacent idempotence, RangeError validation.
- `src/features/notebooks/utils/edit-history.ts` — `HistoryState`, `HistoryAction` (`push` | `undo` | `redo` | `reset`), `historyReducer`, `initialHistory`, `canUndo` / `canRedo`. Push of value deep-equal to present is a no-op (deep-equality via `JSON.stringify` since BuildingBlock is JSON-serialisable plain data).
- `src/features/notebooks/utils/edit-history.test.ts` — 11 cases: round-trip, redo-after-undo, future-clear-on-push, 60-push cap (oldest dropped), no-op on empty stacks, deep-equal-no-op, multi-step LIFO walk.
- `src/features/notebooks/hooks/useDebouncedSave.ts` — generic `useDebouncedSave<T>({ delayMs, onSave })` returning `{ schedule, flush, cancel, isSaving }`. Refs over state to avoid re-rendering the consumer on every keystroke. `onSave` is held in a ref synced via `useEffect` so consumers may pass an inline closure. Settlement-tracking uses split `then(success, failure)` instead of `.finally()` to avoid producing an unhandled-rejection branch when the caller awaits the original promise (a `.finally()` returns a *new* promise that re-rejects).
- `src/features/notebooks/hooks/useDebouncedSave.test.ts` — 9 cases with `vi.useFakeTimers()`: delay timing, burst coalescing (only last value saves), `flush()` short-circuits the timer, `flush()` returns `undefined` when nothing pending, `cancel()` drops pending, unmount clears timer, rejection propagates through the returned promise, `isSaving()` toggles correctly, stable handler identities across re-renders.
- `src/features/notebooks/hooks/useEditHistory.ts` — React wrapper around the pure reducer, exposes `present`, `canUndo`, `canRedo`, and stable `push` / `undo` / `redo` / `reset` callbacks via `useCallback`. CONTEXT decision 3 (150 ms typing-burst coalescing) is the consumer's job — this hook does no debouncing.
- `src/features/notebooks/hooks/useEditHistory.test.ts` — 7 cases: initial empty stacks, push/undo round-trip, redo-after-undo, 60-push cap walk-back-to-block-10, reset clears, handler ref stability across re-renders, push-equal-to-present no-op.

## Notable design decisions

- **Refs over state in `useDebouncedSave`** — every `schedule()` call would otherwise force a re-render of the consumer (the editor shell), thrashing the contentEditable surface during typing. The refs (`timerRef`, `pendingValueRef`, `inFlightRef`, `pendingMarkerRef`) are pure plumbing; nothing the consumer renders depends on them.
- **`PendingMarker` object in `useDebouncedSave`** — `useEffect` cleanup needs to read the marker's current state without retaining a stale reference; an object `{ has: boolean }` is captured once at effect setup, then mutated by other handlers. Resolves the `react-hooks/exhaustive-deps` warning about `pendingMarkerRef.current` being read in cleanup.
- **`splitSpansAtSelection` end-first** — applies the end-position split before the start-position split, since splitting earlier in the array shifts later indices. Index bookkeeping then accounts for the at-most-one extra span the start split inserts before the end boundary.
- **`historyReducer` deep-equality via `JSON.stringify`** — `BuildingBlock` content is JSON-serialisable plain data per the `Module.content` contract (no functions, no `Date`, no cycles). This avoids importing a deep-equal library purely for one usage and keeps the reducer file dependency-free.
- **`useEditHistory` does NOT debounce** — separation of concerns. The consumer (editor shell) is responsible for the 150 ms typing-burst coalescing; this hook is just plumbing. Documented in JSDoc.

## Tests run

```
pnpm test text-spans edit-history useDebouncedSave useEditHistory -- --run
→ 50 passed (50)
```

Pre-existing test infra noise (72 failures across 17 files, all MSW `onUnhandledRequest: error` issues from F2/F3/F7) is unrelated to plan 01-02 (same noise documented in 01-01 SUMMARY).

## Commits

- `41a54b3` feat(phase-1/01-02): add pure TextSpan utilities (split/merge/totalLength) with 23 tests
- `26f0a21` feat(phase-1/01-02): add edit-history reducer (HISTORY_CAP=50, no-op equal pushes) with 11 tests
- `a6629e2` feat(phase-1/01-02): add useDebouncedSave hook (schedule/flush/cancel/isSaving) with 9 tests
- `36a6ac9` feat(phase-1/01-02): add useEditHistory hook (7 tests) and resolve lint findings in pure utils

## Wave 1 status

Plan 01-02 complete. Plans in wave 2 (`01-04-text-block`, `01-05-editor-shell`) consume all four modules created here as black boxes; Plan 01-03 (block registry) does not depend on these.

