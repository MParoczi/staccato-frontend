import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Module, NotebookModuleStyle, ResizeHandle } from '@/lib/types';
import {
  GRID_CANVAS_STYLE_TOKENS,
  GRID_ZOOM_DEFAULT,
} from '@/lib/constants/grid';
import { gridUnitsToPixels } from '@/features/notebooks/utils/grid-layout';
import { cn } from '@/lib/utils';
import { ModuleResizeHandles } from './ModuleResizeHandles';

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

  const positionStyles = useMemo<React.CSSProperties>(
    () => ({
      position: 'absolute',
      left: `${gridUnitsToPixels(module.gridX, zoom)}px`,
      top: `${gridUnitsToPixels(module.gridY, zoom)}px`,
      width: `${gridUnitsToPixels(module.gridWidth, zoom)}px`,
      height: `${gridUnitsToPixels(module.gridHeight, zoom)}px`,
      zIndex: module.zIndex,
    }),
    [
      module.gridX,
      module.gridY,
      module.gridWidth,
      module.gridHeight,
      module.zIndex,
      zoom,
    ],
  );

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
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }
        : undefined,
    [isConflicting],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      onSelect(module.id);
    },
    [module.id, onSelect],
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
      data-testid={`module-card-${module.id}`}
      data-module-id={module.id}
      data-module-type={module.moduleType}
      data-selected={isSelected ? 'true' : 'false'}
      data-conflicting={isConflicting ? 'true' : 'false'}
      role="button"
      tabIndex={0}
      aria-label={moduleLabel}
      aria-pressed={isSelected}
      onClick={handleClick}
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
        role="presentation"
        aria-label={t('notebooks.canvas.dragHandle')}
        className="select-none px-2 py-1 text-xs font-medium"
        style={{
          ...resolved.header,
          cursor: isSelected ? 'grab' : 'default',
          touchAction: 'none',
        }}
      >
        {moduleLabel}
      </div>
      <div
        data-testid={`module-card-body-${module.id}`}
        className="px-2 py-1 text-xs"
        style={resolved.body}
      />
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
