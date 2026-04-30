import {
  useCallback,
  useEffect,
  useState,
  type RefObject,
} from 'react';
import type { Module } from '@/lib/types';
import type { ModuleEditorHandle, ModuleEditorProps } from './ModuleEditor';
import { useDirtyNavBlocker } from '@/features/notebooks/hooks/useDirtyNavBlocker';
import type { ContentSaveStatus } from '@/features/notebooks/hooks/useModuleContentMutation';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

export interface EditModeOverlayProps {
  module: Module;
  /** Wrapper element used for click-outside detection. */
  wrapperRef: RefObject<HTMLDivElement | null>;
  /** Imperative editor handle so the host can `flush()` / `cancel()`. */
  editorRef: RefObject<ModuleEditorHandle | null>;
  /** Called to leave edit mode (host owns the boolean). */
  onExit: () => void;
  /** The lazy editor component (provided by host so React.lazy lives there). */
  LazyEditor: React.ComponentType<
    ModuleEditorProps & { ref?: React.Ref<ModuleEditorHandle> }
  >;
}

/**
 * Edit-mode subtree for `ModuleCard` (plan 01-06 task 6.4).
 *
 * Mounts only while edit mode is active so the canvas-route initial
 * chunk never pulls the editor surface (verified via Vite chunk-split).
 *
 * Owns three host-side concerns that don't belong on the editor itself:
 *   1. Click-outside global `mousedown` listener → flush + exit.
 *   2. `Escape` keydown listener → flush + exit.
 *   3. React Router v7 dirty-nav guard via `useDirtyNavBlocker`. When the
 *      blocker fires the user sees `<UnsavedChangesDialog />`.
 *
 * The Suspense boundary + `React.lazy` import live in the host so the
 * editor module is genuinely code-split (see `ModuleCard.tsx`).
 */
export function EditModeOverlay({
  module,
  wrapperRef,
  editorRef,
  onExit,
  LazyEditor,
}: EditModeOverlayProps) {
  const [saveStatus, setSaveStatus] = useState<ContentSaveStatus>('idle');

  const flushPendingSave = useCallback(
    () => editorRef.current?.flush(),
    [editorRef],
  );

  const blocker = useDirtyNavBlocker({
    isEditing: true,
    saveStatus,
    flushPendingSave,
  });

  // ─── Click-outside (mousedown, capture phase) ─────────────────────────
  // Use mousedown in capture so the gesture lands before any inner click
  // handler that might re-focus the editor. Bail if the click landed
  // inside the wrapper.
  useEffect(() => {
    function handle(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const wrapper = wrapperRef.current;
      if (wrapper && wrapper.contains(target)) return;
      // Outside click → flush silently and exit edit mode (CONTEXT decision 4).
      editorRef.current?.flush();
      onExit();
    }
    document.addEventListener('mousedown', handle, true);
    return () => document.removeEventListener('mousedown', handle, true);
  }, [editorRef, onExit, wrapperRef]);

  // ─── Escape key (document-level) ──────────────────────────────────────
  // Rooting the listener at document level ensures Escape works even when
  // focus is outside the editor (e.g. on the EditButton, body, or wrapper).
  useEffect(() => {
    function handle(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      editorRef.current?.flush();
      onExit();
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [editorRef, onExit]);

  return (
    <>
      <LazyEditor
        ref={editorRef}
        module={module}
        onExitEditMode={onExit}
        onSaveStatusChange={setSaveStatus}
      />
      <UnsavedChangesDialog
        open={blocker.isBlocked}
        onKeepEditing={blocker.reset}
        onDiscard={() => {
          editorRef.current?.cancel();
          blocker.proceed();
        }}
      />
    </>
  );
}

