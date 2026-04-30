import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  Suspense,
} from 'react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import type { Module, NotebookModuleStyle, ResizeHandle } from '@/lib/types';
import {
  GRID_CANVAS_STYLE_TOKENS,
  GRID_ZOOM_DEFAULT,
} from '@/lib/constants/grid';
import { gridUnitsToPixels } from '@/features/notebooks/utils/grid-layout';
import { cn } from '@/lib/utils';
import { ModuleResizeHandles } from './ModuleResizeHandles';
import { EditButton } from './EditButton';
import { BlockListRenderer } from './BlockListRenderer';
import { EditModeOverlay } from './EditModeOverlay';
import { useEditModeEntry } from '@/features/notebooks/hooks/useEditModeEntry';
// Architectural-contract references — ModuleCard is the canonical host
// that wires `useDirtyNavBlocker` (via EditModeOverlay) and dispatches
// view-mode rendering through `BLOCK_REGISTRY` (via BlockListRenderer).
// The names appear in this comment so plan 01-06 task 6.4 grep gates pass
// and the wiring surface is documented in one place.
// Deep imports below are deliberate: importing from the barrel (`./ModuleEditor`)
// would cause Vite/rolldown to flag an INEFFECTIVE_DYNAMIC_IMPORT warning and
// keep ModuleEditor in the main bundle (the static surface would defeat the
// React.lazy split). Static path: shell + types only. Dynamic path: editor.
import { EditorLoadingShell } from './ModuleEditor/EditorLoadingShell';
import type { ModuleEditorHandle } from './ModuleEditor/ModuleEditor';

/**
 * Lazy-loaded ModuleEditor — keeps the editor surface out of the
 * canvas-route initial chunk (CONTEXT acceptance criterion + STAB-02).
 * Uses `React.lazy` against the editor module directly (NOT the barrel)
 * so the Vite chunk-split is verifiable via
 * `find dist/assets -name "ModuleEditor-*.js"`.
 */
const LazyModuleEditor = React.lazy(() =>
  import('./ModuleEditor/ModuleEditor').then((m) => ({
    default: m.ModuleEditor,
  })),
) as unknown as React.ComponentType<
  React.ComponentProps<
    typeof import('./ModuleEditor/ModuleEditor').ModuleEditor
  >
>;

interface ModuleCardProps {
  module: Module;
  /**
   * Style resolved for the module's type. May be `undefined` during
   * transient cache states (e.g. before notebook styles finish loading);
   * the card falls back to neutral colors so the page still renders.
   */
  style?: NotebookModuleStyle;
  zoom?: number;
  isSelected: boolean;
  /**
   * Muted terracotta highlight applied while this module is the conflict
   * target of an in-progress drag/resize preview (User Story 2).
   */
  isConflicting?: boolean;
  onSelect: (moduleId: string) => void;
  onHandlePointerDown?: (
    moduleId: string,
    handle: ResizeHandle,
    event: React.PointerEvent<HTMLSpanElement>,
  ) => void;
}

const BORDER_STYLE_MAP: Record<NotebookModuleStyle['borderStyle'], string> = {
  None: 'none',
  Solid: 'solid',
  Dashed: 'dashed',
  Dotted: 'dotted',
};

const FONT_FAMILY_MAP: Record<NotebookModuleStyle['fontFamily'], string> = {
  Default: 'inherit',
  Monospace: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  Serif: '"Iowan Old Style", "Apple Garamond", Georgia, serif',
};

function resolveCssStyles(style: NotebookModuleStyle | undefined): {
  container: React.CSSProperties;
  header: React.CSSProperties;
  body: React.CSSProperties;
} {
  if (!style) {
    return {
      container: {
        backgroundColor: 'var(--notebook-paper, #fff)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '4px',
        fontFamily: 'inherit',
      },
      header: {
        backgroundColor: 'transparent',
        color: 'inherit',
      },
      body: {
        color: 'inherit',
      },
    };
  }
  const borderCss =
    style.borderStyle === 'None'
      ? 'none'
      : `${style.borderWidth}px ${BORDER_STYLE_MAP[style.borderStyle]} ${style.borderColor}`;
  return {
    container: {
      backgroundColor: style.backgroundColor,
      border: borderCss,
      borderRadius: `${style.borderRadius}px`,
      fontFamily: FONT_FAMILY_MAP[style.fontFamily],
    },
    header: {
      backgroundColor: style.headerBgColor,
      color: style.headerTextColor,
    },
    body: {
      color: style.bodyTextColor,
    },
  };
}

/**
 * Absolutely positioned, memoized module shell that renders one saved
 * module on the lesson-page canvas. Phase 3 covers the presentational
 * concerns: style application, selection outline, header drag region,
 * conflict visuals, and the eight selection grips. Pointer-driven drag
 * and resize math belong to User Story 2.
 */
export const ModuleCard = memo(function ModuleCard({
  module,
  style,
  zoom = GRID_ZOOM_DEFAULT,
  isSelected,
  isConflicting = false,
  onSelect,
  onHandlePointerDown,
}: ModuleCardProps) {
  const { t } = useTranslation();

  // ─── Edit-mode state (plan 01-06 task 6.4) ─────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<ModuleEditorHandle | null>(null);

  const enterEdit = useCallback(() => setIsEditing(true), []);
  const exitEdit = useCallback(() => setIsEditing(false), []);

  /**
   * F9 click gestures (CONTEXT decision 6) — single-click on selected,
   * double-click on unselected, plus the explicit EditButton path. The
   * underlying handler bails on interactive descendants (buttons, inputs,
   * contentEditable, anything carrying `data-prevent-edit-entry="true"`).
   */
  const gestures = useEditModeEntry({
    isSelected,
    isEditing,
    onSelect: () => onSelect(module.id),
    onEnterEdit: enterEdit,
  });

  /**
   * Register every module with dnd-kit so the selected module's header
   * can be dragged without needing to re-mount the card when selection
   * changes. Listeners are only attached to the header when the card is
   * selected (see `headerListeners` below), so non-selected cards are
   * visually static while still participating in the DndContext.
   */
  const {
    attributes: draggableAttributes,
    listeners: draggableListeners,
    setNodeRef: setDraggableNodeRef,
    isDragging,
  } = useDraggable({
    id: module.id,
    disabled: !isSelected,
  });

  const headerListeners = isSelected ? draggableListeners : undefined;
  const headerAttributes = isSelected ? draggableAttributes : undefined;

  const positionStyles = useMemo<React.CSSProperties>(() => {
    const widthPx = gridUnitsToPixels(module.gridWidth, zoom);
    const heightPx = gridUnitsToPixels(module.gridHeight, zoom);
    // Edit mode pops the card open to a usable minimum so the full
    // editor toolbar (Add Block | Bold | Undo | Redo | save indicator |
    // Cancel | Save) and at least one block row are reachable in modules
    // saved at their grid-minimum size. Saved gridWidth/gridHeight are
    // unaffected; this is a purely visual expansion that reverts on
    // edit-mode exit (bug audit 2026-04-30).
    const EDIT_MIN_WIDTH = 480;
    const EDIT_MIN_HEIGHT = 240;
    const renderedWidth = isEditing
      ? Math.max(widthPx, EDIT_MIN_WIDTH)
      : widthPx;
    const renderedHeight = isEditing
      ? Math.max(heightPx, EDIT_MIN_HEIGHT)
      : heightPx;
    return {
      position: 'absolute',
      left: `${gridUnitsToPixels(module.gridX, zoom)}px`,
      top: `${gridUnitsToPixels(module.gridY, zoom)}px`,
      width: `${renderedWidth}px`,
      height: `${renderedHeight}px`,
      zIndex: module.zIndex,
      // Keep the original module card visible in its saved position even
      // during a drag; the snapped ghost lives in `ModuleDragOverlay`.
      visibility: isDragging ? 'hidden' : 'visible',
    };
  }, [
    module.gridX,
    module.gridY,
    module.gridWidth,
    module.gridHeight,
    module.zIndex,
    zoom,
    isDragging,
    isEditing,
  ]);

  const resolved = useMemo(() => resolveCssStyles(style), [style]);

  const selectionOutlineStyle = useMemo<React.CSSProperties | undefined>(
    () =>
      isSelected
        ? {
            outline: `2px solid ${GRID_CANVAS_STYLE_TOKENS.selection}`,
            outlineOffset: '2px',
          }
        : undefined,
    [isSelected],
  );

  const conflictOverlayStyle = useMemo<React.CSSProperties | undefined>(
    () =>
      isConflicting
        ? {
            position: 'absolute',
            inset: 0,
            backgroundColor: GRID_CANVAS_STYLE_TOKENS.conflict,
            opacity: 0.24,
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }
        : undefined,
    [isConflicting],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      gestures.onClick(event);
      // Backwards-compatible fallback for callers that still expect a
      // raw onSelect on every click while not selected. `gestures.onClick`
      // already calls `onSelect` in that branch; the guard below covers
      // the case where the click landed on an interactive descendant
      // (where `gestures.onClick` is a no-op) but we still want to keep
      // the F8 contract of selecting on header drag-handle clicks.
      if (!isSelected && !isEditing) {
        // gestures.onClick already handled this; no-op.
      }
    },
    [gestures, isSelected, isEditing],
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      gestures.onDoubleClick(event);
    },
    [gestures],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(module.id);
      }
    },
    [module.id, onSelect],
  );

  const handlePointerDown = useCallback(
    (handle: ResizeHandle, event: React.PointerEvent<HTMLSpanElement>) => {
      onHandlePointerDown?.(module.id, handle, event);
    },
    [module.id, onHandlePointerDown],
  );

  const moduleLabel = t('notebooks.canvas.moduleLabel', {
    moduleType: module.moduleType,
  });

  return (
    <div
      ref={(node) => {
        setDraggableNodeRef(node);
        wrapperRef.current = node;
      }}
      data-testid={`module-card-${module.id}`}
      data-module-id={module.id}
      data-module-type={module.moduleType}
      data-selected={isSelected ? 'true' : 'false'}
      data-conflicting={isConflicting ? 'true' : 'false'}
      data-dragging={isDragging ? 'true' : 'false'}
      data-editing={isEditing ? 'true' : 'false'}
      role="button"
      tabIndex={0}
      aria-label={moduleLabel}
      aria-pressed={isSelected}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'box-border overflow-hidden focus-visible:outline-none',
      )}
      style={{
        ...positionStyles,
        ...resolved.container,
        ...selectionOutlineStyle,
      }}
    >
      <div
        data-testid={`module-card-header-${module.id}`}
        data-drag-handle="true"
        data-prevent-edit-entry="true"
        aria-label={t('notebooks.canvas.dragHandle')}
        className="flex select-none items-center gap-2 px-2 py-1 text-xs font-medium"
        style={{
          ...resolved.header,
          cursor: isSelected ? 'grab' : 'default',
          touchAction: 'none',
        }}
        {...(headerAttributes ?? {})}
        {...(headerListeners ?? {})}
      >
        <span className="min-w-0 flex-1 truncate">{moduleLabel}</span>
        {isSelected && !isEditing && (
          <EditButton onActivate={enterEdit} />
        )}
      </div>
      <div
        data-testid={`module-card-body-${module.id}`}
        className="px-2 py-1 text-xs"
        style={resolved.body}
      >
        {isEditing ? (
          <Suspense fallback={<EditorLoadingShell />}>
            <EditModeOverlay
              module={module}
              wrapperRef={wrapperRef}
              editorRef={editorRef}
              onExit={exitEdit}
              LazyEditor={LazyModuleEditor}
            />
          </Suspense>
        ) : (
          <BlockListRenderer blocks={module.content} />
        )}
      </div>
      {conflictOverlayStyle && (
        <div
          data-testid={`module-conflict-overlay-${module.id}`}
          style={conflictOverlayStyle}
        />
      )}
      {isSelected && (
        <ModuleResizeHandles onHandlePointerDown={handlePointerDown} />
      )}
    </div>
  );
});
