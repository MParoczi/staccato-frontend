import { useCallback } from 'react';

/** Walk up from `target` until we hit `gestureRoot`; return true if any
 * ancestor is an interactive element that should consume the click instead
 * of passing it through to the gesture handler. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  let node: HTMLElement | null = target as HTMLElement | null;
  while (node && node instanceof HTMLElement) {
    if (node.dataset.preventEditEntry === 'true') return true;
    const tag = node.tagName;
    if (
      tag === 'BUTTON' ||
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      tag === 'A' ||
      node.isContentEditable
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

export interface UseEditModeEntryArgs {
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEnterEdit: () => void;
}

export interface UseEditModeEntryResult {
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
}

/**
 * Encapsulates the F9 edit-mode entry gestures (CONTEXT decision 6):
 *
 * - Single-click on an unselected module → selects it.
 * - Single-click on an already-selected module → enters edit mode.
 * - Double-click on an unselected module → selects then enters edit mode.
 * - Click while already editing → no-op (let the editor handle).
 * - Click whose target is an interactive descendant (button, input,
 *   contentEditable, or anything carrying `data-prevent-edit-entry="true"`)
 *   → no-op so the descendant owns the gesture.
 */
export function useEditModeEntry({
  isSelected,
  isEditing,
  onSelect,
  onEnterEdit,
}: UseEditModeEntryArgs): UseEditModeEntryResult {
  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (isInteractiveTarget(e.target)) return;
      if (isEditing) return;
      if (isSelected) onEnterEdit();
      else onSelect();
    },
    [isEditing, isSelected, onEnterEdit, onSelect],
  );
  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isInteractiveTarget(e.target)) return;
      if (isEditing) return;
      if (!isSelected) onSelect();
      onEnterEdit();
    },
    [isEditing, isSelected, onEnterEdit, onSelect],
  );
  return { onClick, onDoubleClick };
}

