import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ResizeHandle } from '@/lib/types';
import { GRID_CANVAS_STYLE_TOKENS } from '@/lib/constants/grid';

interface ModuleResizeHandlesProps {
  /**
   * Optional pointer-down callback for a handle. Phase 3 renders the
   * handles as presentational affordances only; User Story 2 (drag/resize)
   * wires pointer tracking through this hook.
   */
  onHandlePointerDown?: (
    handle: ResizeHandle,
    event: React.PointerEvent<HTMLSpanElement>,
  ) => void;
}

interface HandleDescriptor {
  readonly handle: ResizeHandle;
  readonly position: React.CSSProperties;
  readonly cursor: string;
}

const HANDLE_SIZE_PX = 10;

const HANDLES: readonly HandleDescriptor[] = [
  { handle: 'nw', position: { top: 0, left: 0 }, cursor: 'nwse-resize' },
  { handle: 'n', position: { top: 0, left: '50%' }, cursor: 'ns-resize' },
  { handle: 'ne', position: { top: 0, right: 0 }, cursor: 'nesw-resize' },
  { handle: 'e', position: { top: '50%', right: 0 }, cursor: 'ew-resize' },
  { handle: 'se', position: { bottom: 0, right: 0 }, cursor: 'nwse-resize' },
  { handle: 's', position: { bottom: 0, left: '50%' }, cursor: 'ns-resize' },
  { handle: 'sw', position: { bottom: 0, left: 0 }, cursor: 'nesw-resize' },
  { handle: 'w', position: { top: '50%', left: 0 }, cursor: 'ew-resize' },
];

/**
 * Eight presentational selection grips rendered on the edges and corners
 * of the selected module. Phase 3 keeps pointer-driven resize math out of
 * scope per the tasks.md split; this component exposes an
 * `onHandlePointerDown` prop so User Story 2 can attach pointer tracking
 * without re-rendering the handle layout.
 */
export const ModuleResizeHandles = memo(function ModuleResizeHandles({
  onHandlePointerDown,
}: ModuleResizeHandlesProps) {
  const { t } = useTranslation();

  return (
    <>
      {HANDLES.map(({ handle, position, cursor }) => (
        <span
          key={handle}
          data-testid={`module-resize-handle-${handle}`}
          data-handle={handle}
          role="presentation"
          aria-label={t(`notebooks.canvas.handles.${handle}`)}
          onPointerDown={(event) => onHandlePointerDown?.(handle, event)}
          style={{
            position: 'absolute',
            width: `${HANDLE_SIZE_PX}px`,
            height: `${HANDLE_SIZE_PX}px`,
            marginLeft: `-${HANDLE_SIZE_PX / 2}px`,
            marginTop: `-${HANDLE_SIZE_PX / 2}px`,
            background: 'var(--notebook-paper, #fff)',
            border: `1px solid ${GRID_CANVAS_STYLE_TOKENS.selection}`,
            borderRadius: '2px',
            boxShadow: '0 1px 2px rgb(74 52 38 / 0.25)',
            cursor,
            touchAction: 'none',
            ...position,
          }}
        />
      ))}
    </>
  );
});
