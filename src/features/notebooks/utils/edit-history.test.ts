import { describe, expect, it } from 'vitest';
import {
  HISTORY_CAP,
  canRedo,
  canUndo,
  historyReducer,
  initialHistory,
  type HistoryState,
} from './edit-history';
import type { BuildingBlock } from '@/lib/types';

const block = (id: string): BuildingBlock =>
  ({ type: 'text', id, spans: [{ text: id, bold: false }] }) as unknown as BuildingBlock;

const init = (blocks: BuildingBlock[]): HistoryState => initialHistory(blocks);

describe('historyReducer', () => {
  it('initialHistory creates empty stacks', () => {
    const state = init([block('a')]);
    expect(state.past).toEqual([]);
    expect(state.future).toEqual([]);
    expect(state.present).toEqual([block('a')]);
    expect(canUndo(state)).toBe(false);
    expect(canRedo(state)).toBe(false);
  });

  it('push then undo round-trips to original present', () => {
    const s0 = init([block('a')]);
    const s1 = historyReducer(s0, { type: 'push', next: [block('a'), block('b')] });
    const s2 = historyReducer(s1, { type: 'undo' });
    expect(s2.present).toEqual([block('a')]);
    expect(canRedo(s2)).toBe(true);
  });

  it('redo after undo restores the post-push state', () => {
    const s0 = init([block('a')]);
    const s1 = historyReducer(s0, { type: 'push', next: [block('a'), block('b')] });
    const s2 = historyReducer(s1, { type: 'undo' });
    const s3 = historyReducer(s2, { type: 'redo' });
    expect(s3.present).toEqual([block('a'), block('b')]);
    expect(canRedo(s3)).toBe(false);
  });

  it('push clears any accumulated future', () => {
    let s = init([block('a')]);
    s = historyReducer(s, { type: 'push', next: [block('b')] });
    s = historyReducer(s, { type: 'undo' });
    expect(canRedo(s)).toBe(true);
    s = historyReducer(s, { type: 'push', next: [block('c')] });
    expect(s.future).toEqual([]);
    expect(canRedo(s)).toBe(false);
  });

  it('caps past length at HISTORY_CAP, dropping the oldest entry', () => {
    let s = init([block('0')]);
    // 60 distinct pushes — past cap is 50
    for (let i = 1; i <= 60; i++) {
      s = historyReducer(s, { type: 'push', next: [block(String(i))] });
    }
    expect(s.past.length).toBe(HISTORY_CAP);
    expect(s.present).toEqual([block('60')]);
    // Oldest retained snapshot in past should be block('10') (we dropped 0..9)
    expect(s.past[0]).toEqual([block('10')]);
  });

  it('undo on empty past is a no-op', () => {
    const s0 = init([block('a')]);
    const s1 = historyReducer(s0, { type: 'undo' });
    expect(s1).toBe(s0);
  });

  it('redo on empty future is a no-op', () => {
    const s0 = init([block('a')]);
    const s1 = historyReducer(s0, { type: 'redo' });
    expect(s1).toBe(s0);
  });

  it('push of value deep-equal to present is a no-op', () => {
    const s0 = init([block('a')]);
    const s1 = historyReducer(s0, { type: 'push', next: [block('a')] });
    expect(s1).toBe(s0);
    expect(s1.past).toEqual([]);
  });

  it('reset clears past and future and updates present', () => {
    let s = init([block('a')]);
    s = historyReducer(s, { type: 'push', next: [block('b')] });
    s = historyReducer(s, { type: 'push', next: [block('c')] });
    s = historyReducer(s, { type: 'undo' });
    s = historyReducer(s, { type: 'reset', initial: [block('z')] });
    expect(s.past).toEqual([]);
    expect(s.future).toEqual([]);
    expect(s.present).toEqual([block('z')]);
  });

  it('canUndo / canRedo reflect stack non-emptiness', () => {
    let s = init([block('a')]);
    expect(canUndo(s)).toBe(false);
    expect(canRedo(s)).toBe(false);
    s = historyReducer(s, { type: 'push', next: [block('b')] });
    expect(canUndo(s)).toBe(true);
    expect(canRedo(s)).toBe(false);
    s = historyReducer(s, { type: 'undo' });
    expect(canUndo(s)).toBe(false);
    expect(canRedo(s)).toBe(true);
  });

  it('multiple undos walk the past stack in LIFO order', () => {
    let s = init([block('a')]);
    s = historyReducer(s, { type: 'push', next: [block('b')] });
    s = historyReducer(s, { type: 'push', next: [block('c')] });
    s = historyReducer(s, { type: 'undo' });
    expect(s.present).toEqual([block('b')]);
    s = historyReducer(s, { type: 'undo' });
    expect(s.present).toEqual([block('a')]);
    expect(canUndo(s)).toBe(false);
  });
});

