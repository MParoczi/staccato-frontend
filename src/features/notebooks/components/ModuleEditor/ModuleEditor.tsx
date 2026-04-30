import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BuildingBlock, BuildingBlockType, Module } from '@/lib/types';
import { isTextSpan } from '@/lib/types';
import { isBlockAllowed } from '@/features/styling/utils/module-type-config';
import { BLOCK_REGISTRY } from '@/features/notebooks/blocks/registry';
import { useEditHistory } from '@/features/notebooks/hooks/useEditHistory';
import {
  useModuleContentMutation,
  type ContentSaveStatus,
} from '@/features/notebooks/hooks/useModuleContentMutation';
import { EditorToolbar } from './EditorToolbar';
import { BlockRow } from './BlockRow';
import { DeleteBlockDialog } from './DeleteBlockDialog';
import { BreadcrumbEmptyState } from './BreadcrumbEmptyState';

/** Imperative handle exposed by `ModuleEditor` for the host (plan 01-06). */
export interface ModuleEditorHandle {
  /** Flush any pending PUT now. Returns the in-flight promise (or undefined). */
  flush: () => Promise<Module> | undefined;
  /** Drop pending PUT and revert the cache to the pre-edit snapshot. */
  cancel: () => void;
}

export interface ModuleEditorProps {
  module: Module;
  /** Called when the editor wishes to exit edit mode (Save/Cancel/Esc). */
  onExitEditMode: () => void;
  /**
   * Optional observer invoked whenever the underlying mutation status
   * changes. Used by the host (plan 01-06) to power the dirty-nav guard
   * without prop drilling the mutation hook.
   */
  onSaveStatusChange?: (status: ContentSaveStatus) => void;
}

const TYPING_BURST_MS = 150;

/** Heuristic: true when a block carries no user content yet. */
function isEmptyBlock(block: BuildingBlock): boolean {
  if (block.type === 'Text') {
    const spans = Array.isArray(block.spans) ? block.spans : [];
    if (spans.length === 0) return true;
    return spans.every((s) => isTextSpan(s) && s.text.trim().length === 0);
  }
  // Unimplemented placeholder blocks: treat as empty so delete is silent.
  return BLOCK_REGISTRY[block.type].implemented === false;
}

/**
 * Defense-in-depth filter: keep only blocks the host module type permits.
 * Throws in dev to surface bugs immediately; silently filters in prod so a
 * future regression can't poison the cache.
 */
function enforceAllowedBlocks(
  moduleType: Module['moduleType'],
  blocks: BuildingBlock[],
): BuildingBlock[] {
  const ok = blocks.every((b) => isBlockAllowed(moduleType, b.type));
  if (ok) return blocks;
  if (import.meta.env.DEV) {
    throw new Error(
      `[ModuleEditor] disallowed block type for module ${moduleType}: ${blocks
        .filter((b) => !isBlockAllowed(moduleType, b.type))
        .map((b) => b.type)
        .join(', ')}`,
    );
  }
  return blocks.filter((b) => isBlockAllowed(moduleType, b.type));
}

interface SortableRowProps {
  id: string;
  index: number;
  block: BuildingBlock;
  onChange: (next: BuildingBlock) => void;
  onDelete: () => void;
}

/** Per-row wrapper with `useSortable`; passes drag-handle props down. */
function SortableRow({ id, index, block, onChange, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };
  const dragHandleProps: React.HTMLAttributes<HTMLButtonElement> = {
    ref: setActivatorNodeRef as unknown as React.Ref<HTMLButtonElement>,
    ...attributes,
    ...(listeners ?? {}),
  } as React.HTMLAttributes<HTMLButtonElement>;
  return (
    <div ref={setNodeRef} style={style}>
      <BlockRow
        block={block}
        index={index}
        onChange={onChange}
        onDelete={onDelete}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
}

/**
 * ModuleEditor — orchestrator for a module's edit-mode surface (UI-SPEC §4).
 *
 * Composes the toolbar, the vertically-sortable block list, and the delete
 * confirmation dialog. Owns whole-module undo/redo (with 150 ms typing-burst
 * coalescing per CONTEXT decision 3) and delegates persistence to
 * `useModuleContentMutation` (1000 ms debounced PUT). For Breadcrumb modules
 * renders the read-only auto-gen empty state and disables Save/Add Block.
 *
 * Exposes an imperative handle so the host (plan 01-06) can flush on
 * click-outside without prop drilling.
 *
 * **Bold tracking limitation:** the toolbar's Bold button is rendered but
 * the cross-wiring to the active TextSpanEditor's `toggleBold` ref is
 * parked until `BlockEditorProps` is widened to expose
 * `onReady`/`onBoldStateChange`. The Ctrl+B keyboard shortcut inside
 * `TextSpanEditor` continues to work end-to-end. Tracked as plan 01-06
 * follow-up.
 */
export const ModuleEditor = forwardRef<ModuleEditorHandle, ModuleEditorProps>(
  function ModuleEditor({ module, onExitEditMode, onSaveStatusChange }, ref) {
    const { t } = useTranslation();
    const isBreadcrumb = module.moduleType === 'Breadcrumb';

    const history = useEditHistory(module.content);
    const mutation = useModuleContentMutation({
      pageId: module.lessonPageId,
      moduleId: module.id,
    });

    const content = history.present;

    // ─── Typing-burst coalescing for history.push ─────────────────────────
    // Per CONTEXT decision 3 we keep history coarse: a single push lands
    // 150 ms after the last edit settles. The cache and the debounced PUT
    // update on every keystroke; only the undo stack is coalesced.
    const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingPushRef = useRef<BuildingBlock[] | null>(null);
    const clearPushTimer = () => {
      if (pushTimerRef.current !== null) {
        clearTimeout(pushTimerRef.current);
        pushTimerRef.current = null;
      }
    };
    const flushPendingPush = useCallback(() => {
      clearPushTimer();
      const c = pendingPushRef.current;
      pendingPushRef.current = null;
      if (c !== null) history.push(c);
    }, [history]);

    /**
     * Single sink for content mutations. Schedules optimistic save (1000 ms
     * debounce inside the mutation hook) and a coalesced history push.
     * Pass `immediateHistory=true` for structural edits (add, delete,
     * reorder) so undo records each one as a discrete step.
     */
    const pushContent = useCallback(
      (next: BuildingBlock[], opts: { immediateHistory?: boolean } = {}) => {
        const filtered = enforceAllowedBlocks(module.moduleType, next);
        mutation.schedule(filtered);
        if (opts.immediateHistory) {
          clearPushTimer();
          pendingPushRef.current = null;
          history.push(filtered);
        } else {
          pendingPushRef.current = filtered;
          clearPushTimer();
          pushTimerRef.current = setTimeout(() => {
            pushTimerRef.current = null;
            const c = pendingPushRef.current;
            pendingPushRef.current = null;
            if (c !== null) history.push(c);
          }, TYPING_BURST_MS);
        }
      },
      [history, module.moduleType, mutation],
    );

    useEffect(
      () => () => {
        clearPushTimer();
      },
      [],
    );

    // Toolbar Bold (state-only; see header comment).
    const [isBoldActive] = useState(false);
    const handleToggleBold = useCallback(() => {
      // Future: route to active TextSpanEditor.toggleBold via ref Map.
      // Ctrl+B inside the contentEditable is the working path today.
    }, []);

    // ─── Add Block flow ──────────────────────────────────────────────────
    const handleAddBlock = useCallback(
      (type: BuildingBlockType) => {
        const desc = BLOCK_REGISTRY[type];
        const next = [...content, desc.create()];
        pushContent(next, { immediateHistory: true });
      },
      [content, pushContent],
    );

    // ─── Delete flow ─────────────────────────────────────────────────────
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(
      null,
    );
    const performDelete = useCallback(
      (index: number) => {
        const next = content.filter((_, i) => i !== index);
        pushContent(next, { immediateHistory: true });
      },
      [content, pushContent],
    );
    const handleDelete = useCallback(
      (index: number) => {
        const block = content[index];
        if (block && isEmptyBlock(block)) {
          performDelete(index);
        } else {
          setPendingDeleteIndex(index);
        }
      },
      [content, performDelete],
    );

    // ─── Reorder flow (dnd-kit) ──────────────────────────────────────────
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );
    const sortableIds = useMemo(
      () => content.map((_, i) => `block-${i}`),
      [content],
    );
    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = sortableIds.indexOf(String(active.id));
        const to = sortableIds.indexOf(String(over.id));
        if (from === -1 || to === -1) return;
        const next = arrayMove(content, from, to);
        pushContent(next, { immediateHistory: true });
      },
      [content, pushContent, sortableIds],
    );

    // ─── Per-row callback ────────────────────────────────────────────────
    const handleRowChange = useCallback(
      (index: number, next: BuildingBlock) => {
        const arr = [...content];
        arr[index] = next;
        pushContent(arr);
      },
      [content, pushContent],
    );

    // ─── Save / Cancel ───────────────────────────────────────────────────
    const handleSave = useCallback(() => {
      flushPendingPush();
      const promise = mutation.flush();
      if (promise === undefined) {
        onExitEditMode();
        return;
      }
      promise.then(
        () => onExitEditMode(),
        () => {
          /* stay in edit mode; toast already fired */
        },
      );
    }, [flushPendingPush, mutation, onExitEditMode]);

    const handleCancel = useCallback(() => {
      clearPushTimer();
      pendingPushRef.current = null;
      mutation.cancel();
      mutation.revertOptimistic();
      onExitEditMode();
    }, [mutation, onExitEditMode]);

    // ─── Keyboard shortcuts (Esc / Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y) ───────
    const rootRef = useRef<HTMLDivElement | null>(null);
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          handleSave();
          return;
        }
        const meta = event.ctrlKey || event.metaKey;
        if (meta && (event.key === 'z' || event.key === 'Z')) {
          event.preventDefault();
          flushPendingPush();
          if (event.shiftKey) history.redo();
          else history.undo();
        } else if (meta && (event.key === 'y' || event.key === 'Y')) {
          event.preventDefault();
          flushPendingPush();
          history.redo();
        }
      },
      [flushPendingPush, handleSave, history],
    );

    // Propagate undo/redo-driven content changes back into the cache so the
    // page-modules query reflects the current `present`.
    const lastPropagatedRef = useRef<BuildingBlock[]>(module.content);
    useEffect(() => {
      if (history.present !== lastPropagatedRef.current) {
        lastPropagatedRef.current = history.present;
        mutation.schedule(history.present);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [history.present]);

    // ─── Imperative handle for host (click-outside flush) ────────────────
    useImperativeHandle(
      ref,
      () => ({
        flush: () => {
          flushPendingPush();
          return mutation.flush();
        },
        cancel: () => {
          clearPushTimer();
          pendingPushRef.current = null;
          mutation.cancel();
          mutation.revertOptimistic();
        },
      }),
      [flushPendingPush, mutation],
    );

    const saveStatus: ContentSaveStatus = mutation.status;

    useEffect(() => {
      onSaveStatusChange?.(saveStatus);
    }, [saveStatus, onSaveStatusChange]);

    return (
      <div
        ref={rootRef}
        data-edit-mode="true"
        data-module-id={module.id}
        onKeyDown={handleKeyDown}
        className="relative flex h-full flex-col overflow-hidden rounded-md bg-card outline outline-2 outline-offset-2"
        style={{
          outlineColor: 'var(--editor-edit-glow-ring)',
          boxShadow: '0 0 0 6px var(--editor-edit-glow)',
        }}
        aria-label={t('editor.edit')}
      >
        <EditorToolbar
          moduleType={module.moduleType}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          isBoldActive={isBoldActive}
          saveStatus={saveStatus}
          onAddBlock={handleAddBlock}
          onUndo={() => {
            flushPendingPush();
            history.undo();
          }}
          onRedo={() => {
            flushPendingPush();
            history.redo();
          }}
          onToggleBold={handleToggleBold}
          onCancel={handleCancel}
          onSave={handleSave}
        />

        <div className="flex-1 overflow-y-auto p-3">
          {isBreadcrumb ? (
            <BreadcrumbEmptyState />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortableIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {content.map((block, index) => (
                    <SortableRow
                      key={sortableIds[index]}
                      id={sortableIds[index]}
                      index={index}
                      block={block}
                      onChange={(next) => handleRowChange(index, next)}
                      onDelete={() => handleDelete(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <DeleteBlockDialog
          open={pendingDeleteIndex !== null}
          onOpenChange={(next) => {
            if (!next) setPendingDeleteIndex(null);
          }}
          onConfirm={() => {
            if (pendingDeleteIndex !== null) {
              performDelete(pendingDeleteIndex);
              setPendingDeleteIndex(null);
            }
          }}
        />
      </div>
    );
  },
);

export default ModuleEditor;

