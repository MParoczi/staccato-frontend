import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditModeEntry } from './useEditModeEntry';

function makeArgs(over: Partial<Parameters<typeof useEditModeEntry>[0]> = {}) {
  return {
    isSelected: false,
    isEditing: false,
    onSelect: vi.fn(),
    onEnterEdit: vi.fn(),
    ...over,
  };
}

/** Build a fake React.MouseEvent good enough for our handler shape. */
function fakeEvent(target?: HTMLElement): React.MouseEvent {
  return { target: target ?? document.createElement('div') } as unknown as React.MouseEvent;
}

describe('useEditModeEntry', () => {
  it('single-click on unselected → onSelect, not onEnterEdit', () => {
    const args = makeArgs({ isSelected: false });
    const { result } = renderHook(() => useEditModeEntry(args));
    result.current.onClick(fakeEvent());
    expect(args.onSelect).toHaveBeenCalledTimes(1);
    expect(args.onEnterEdit).not.toHaveBeenCalled();
  });

  it('single-click on already-selected → onEnterEdit', () => {
    const args = makeArgs({ isSelected: true });
    const { result } = renderHook(() => useEditModeEntry(args));
    result.current.onClick(fakeEvent());
    expect(args.onEnterEdit).toHaveBeenCalledTimes(1);
    expect(args.onSelect).not.toHaveBeenCalled();
  });

  it('double-click on unselected → onSelect THEN onEnterEdit', () => {
    const args = makeArgs({ isSelected: false });
    const order: string[] = [];
    args.onSelect.mockImplementation(() => order.push('select'));
    args.onEnterEdit.mockImplementation(() => order.push('enter'));
    const { result } = renderHook(() => useEditModeEntry(args));
    result.current.onDoubleClick(fakeEvent());
    expect(order).toEqual(['select', 'enter']);
  });

  it('click while already editing → no-op', () => {
    const args = makeArgs({ isSelected: true, isEditing: true });
    const { result } = renderHook(() => useEditModeEntry(args));
    result.current.onClick(fakeEvent());
    result.current.onDoubleClick(fakeEvent());
    expect(args.onSelect).not.toHaveBeenCalled();
    expect(args.onEnterEdit).not.toHaveBeenCalled();
  });

  it('click target with data-prevent-edit-entry ancestor → no-op', () => {
    const wrapper = document.createElement('div');
    wrapper.dataset.preventEditEntry = 'true';
    const child = document.createElement('span');
    wrapper.appendChild(child);
    const args = makeArgs({ isSelected: true });
    const { result } = renderHook(() => useEditModeEntry(args));
    result.current.onClick(fakeEvent(child));
    expect(args.onSelect).not.toHaveBeenCalled();
    expect(args.onEnterEdit).not.toHaveBeenCalled();
  });

  it('click target inside a <button> ancestor → no-op (interactive guard)', () => {
    const btn = document.createElement('button');
    const inner = document.createElement('span');
    btn.appendChild(inner);
    const args = makeArgs({ isSelected: true });
    const { result } = renderHook(() => useEditModeEntry(args));
    result.current.onClick(fakeEvent(inner));
    expect(args.onEnterEdit).not.toHaveBeenCalled();
  });
});

