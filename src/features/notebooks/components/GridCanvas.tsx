import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Module, ModuleType, NotebookModuleStyle } from '@/lib/types';
import type { PageSize } from '@/lib/types/common';
import { DottedPaper } from '@/components/common/DottedPaper';
import { useUIStore } from '@/stores/uiStore';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';
import { ModuleCard } from './ModuleCard';

interface GridCanvasProps {
  pageSize: PageSize;
  modules: readonly Module[];
  styles?: readonly NotebookModuleStyle[];
  className?: string;
}

function buildStylesByType(
  styles: readonly NotebookModuleStyle[] | undefined,
): Partial<Record<ModuleType, NotebookModuleStyle>> {
  if (!styles) return {};
  const map: Partial<Record<ModuleType, NotebookModuleStyle>> = {};
  for (const style of styles) {
    map[style.moduleType] = style;
  }
  return map;
}

/**
 * Positioned canvas surface for the active lesson page.
 *
 * Phase 3 (User Story 1) scope: render the true-sized dotted-paper
 * surface, stack saved modules using their z-index, wire selection via
 * `ModuleCard`, and clear selection on empty-canvas clicks.
 * Drag/resize, context menus, zoom controls, and the module picker are
 * layered in by the later user-story phases.
 */
export function GridCanvas({
  pageSize,
  modules,
  styles,
  className,
}: GridCanvasProps) {
  const { t } = useTranslation();
  const zoom = useUIStore((state) => state.zoom);
  const { selectedModuleId, selectModule, handleCanvasPointerDown } =
    useCanvasInteractions();

  const stylesByType = useMemo(
    () => buildStylesByType(styles),
    [styles],
  );

  /**
   * Sort a copy of the modules by z-index ascending so DOM order matches
   * visual stacking order (lowest z-index painted first). Ties break by
   * id to keep the render order stable across rerenders.
   */
  const orderedModules = useMemo(
    () =>
      [...modules].sort((a, b) => {
        if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
        return a.id.localeCompare(b.id);
      }),
    [modules],
  );

  return (
    <DottedPaper
      pageSize={pageSize}
      zoom={zoom}
      className={className}
    >
      <div
        data-testid="grid-canvas-surface"
        role="presentation"
        aria-label={t('notebooks.canvas.surfaceLabel')}
        onPointerDown={handleCanvasPointerDown}
        className="absolute inset-0"
      >
        {orderedModules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            style={stylesByType[module.moduleType]}
            zoom={zoom}
            isSelected={selectedModuleId === module.id}
            onSelect={selectModule}
          />
        ))}
      </div>
    </DottedPaper>
  );
}
