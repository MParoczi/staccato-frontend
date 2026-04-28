import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useEditHistory } from './useEditHistory';
import { HISTORY_CAP } from '../utils/edit-history';
import type { BuildingBlock } from '@/lib/types';

const block = (id: string): BuildingBlock =>
  ({ type: 'text', id, spans: [{ text: id, bold: false }] }) as unknown as BuildingBlock;

describe('useEditHistory', () => {
  it('initial state matches the supplied array; canUndo/canRedo are false', () => {
    const { result } = renderHook(() => useEditHistory([block('a')]));
    expect(result.current.present).toEqual([block('a')]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('push then undo returns to original present and flips canRedo', () => {
    const { result } = renderHook(() => useEditHistory([block('a')]));
    act(() => result.current.push([block('a'), block('b')]));
    expect(result.current.present).toEqual([block('a'), block('b')]);
    act(() => result.current.undo());
    expect(result.current.present).toEqual([block('a')]);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo after undo restores the pushed state', () => {
    const { result } = renderHook(() => useEditHistory([block('a')]));
    act(() => result.current.push([block('b')]));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.present).toEqual([block('b')]);
    expect(result.current.canRedo).toBe(false);
  });

  it('caps internal past at HISTORY_CAP (push 60 → 51 undos walk no further than 50)', () => {
    const { result } = renderHook(() => useEditHistory([block('0')]));
    for (let i = 1; i <= 60; i++) {
      const v = i;
      act(() => result.current.push([block(String(v))]));
    }
    expect(result.current.present).toEqual([block('60')]);
    // Undo 50 times — should walk back exactly 50 snapshots and stop.
    for (let i = 0; i < HISTORY_CAP; i++) {
      act(() => result.current.undo());
    }
    // After 50 undos the present is the oldest retained snapshot, i.e. block('10').
    expect(result.current.present).toEqual([block('10')]);
    expect(result.current.canUndo).toBe(false);
    // 51st undo is a no-op.
    const before = result.current.present;
    act(() => result.current.undo());
    expect(result.current.present).toBe(before);
  });

  it('reset clears history and updates present', () => {
    const { result } = renderHook(() => useEditHistory([block('a')]));
    act(() => result.current.push([block('b')]));
    act(() => result.current.push([block('c')]));
    act(() => result.current.reset([block('z')]));
    expect(result.current.present).toEqual([block('z')]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('handler refs are stable across re-renders triggered by other state', () => {
    const { result, rerender } = renderHook(() => useEditHistory([block('a')]));
    const push1 = result.current.push;
    const undo1 = result.current.undo;
    const redo1 = result.current.redo;
    const reset1 = result.current.reset;
    // Trigger a re-render via a state-changing action.
    act(() => result.current.push([block('b')]));
    rerender();
    expect(result.current.push).toBe(push1);
    expect(result.current.undo).toBe(undo1);
    expect(result.current.redo).toBe(redo1);
    expect(result.current.reset).toBe(reset1);
  });

  it('push of value deep-equal to present is a no-op (no canUndo flip)', () => {
    const { result } = renderHook(() => useEditHistory([block('a')]));
    act(() => result.current.push([block('a')]));
    expect(result.current.canUndo).toBe(false);
  });
});

