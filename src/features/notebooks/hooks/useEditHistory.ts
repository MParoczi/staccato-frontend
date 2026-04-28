import { useCallback, useReducer } from 'react';
import type { BuildingBlock } from '@/lib/types';
import {
  canRedo as canRedoSelector,
  canUndo as canUndoSelector,
  historyReducer,
  initialHistory,
} from '../utils/edit-history';

/**
 * Thin React wrapper around the pure `historyReducer`. Exposes stable
 * callback references via `useCallback` so consumers can pass the handlers
 * straight into deps arrays / event listeners without re-creating them.
 *
 * Per CONTEXT decision 3, the 150 ms typing-burst coalescing is the
 * editor shell's responsibility — this hook performs *no* debouncing and
 * pushes whatever the consumer hands it (subject to the reducer's
 * deep-equal no-op rule).
 */
export interface UseEditHistoryResult {
  present: BuildingBlock[];
  canUndo: boolean;
  canRedo: boolean;
  push: (next: BuildingBlock[]) => void;
  undo: () => void;
  redo: () => void;
  reset: (initial: BuildingBlock[]) => void;
}

export function useEditHistory(initial: BuildingBlock[]): UseEditHistoryResult {
  const [state, dispatch] = useReducer(historyReducer, initial, initialHistory);

  const push = useCallback((next: BuildingBlock[]) => {
    dispatch({ type: 'push', next });
  }, []);
  const undo = useCallback(() => {
    dispatch({ type: 'undo' });
  }, []);
  const redo = useCallback(() => {
    dispatch({ type: 'redo' });
  }, []);
  const reset = useCallback((next: BuildingBlock[]) => {
    dispatch({ type: 'reset', initial: next });
  }, []);

  return {
    present: state.present,
    canUndo: canUndoSelector(state),
    canRedo: canRedoSelector(state),
    push,
    undo,
    redo,
    reset,
  };
}

