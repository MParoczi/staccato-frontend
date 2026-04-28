import type { BuildingBlock } from '@/lib/types';

/**
 * Whole-module undo/redo reducer (CONTEXT decision 3).
 *
 * Each entry represents the full `BuildingBlock[]` content of a module; we
 * snapshot at every coalesced edit boundary instead of trying to record
 * granular block-level deltas. This trades memory (capped at HISTORY_CAP)
 * for simplicity and trivially-correct undo/redo semantics.
 *
 * The reducer itself is fully pure — no DOM, no timers, no React. The
 * 150 ms typing-burst coalescing is the consumer's responsibility (see
 * `useEditHistory` and the editor shell hook).
 */
export interface HistoryState {
  past: BuildingBlock[][];
  present: BuildingBlock[];
  future: BuildingBlock[][];
}

/** Maximum number of `past` snapshots retained; oldest is dropped on overflow. */
export const HISTORY_CAP = 50;

export type HistoryAction =
  | { type: 'push'; next: BuildingBlock[] }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; initial: BuildingBlock[] };

export function initialHistory(initial: BuildingBlock[]): HistoryState {
  return { past: [], present: initial, future: [] };
}

export function canUndo(state: HistoryState): boolean {
  return state.past.length > 0;
}

export function canRedo(state: HistoryState): boolean {
  return state.future.length > 0;
}

/**
 * Stable, structural deep-equality for `BuildingBlock[]`. The reducer uses
 * this to skip pushing redundant snapshots that would clutter the history
 * stack with no observable change.
 *
 * Implementation: JSON.stringify is sufficient because `BuildingBlock`
 * values are JSON-serialisable plain data (no functions, no `Date`, no
 * cycles) per the `Module.content` contract.
 */
function blocksEqual(a: BuildingBlock[], b: BuildingBlock[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  switch (action.type) {
    case 'push': {
      if (blocksEqual(action.next, state.present)) return state;
      const past =
        state.past.length >= HISTORY_CAP
          ? state.past.slice(1).concat([state.present])
          : state.past.concat([state.present]);
      return { past, present: action.next, future: [] };
    }
    case 'undo': {
      if (state.past.length === 0) return state;
      const newPast = state.past.slice(0, -1);
      const previous = state.past[state.past.length - 1];
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'redo': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: state.past.concat([state.present]),
        present: next,
        future: newFuture,
      };
    }
    case 'reset':
      return initialHistory(action.initial);
    default:
      return state;
  }
}

