import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModuleCard } from './ModuleCard';
import type { Module, NotebookModuleStyle } from '@/lib/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && typeof options === 'object' && 'moduleType' in options) {
        return `${String(options.moduleType)} module`;
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'module-1',
    lessonPageId: 'page-1',
    moduleType: 'Theory',
    gridX: 2,
    gridY: 3,
    gridWidth: 10,
    gridHeight: 6,
    zIndex: 5,
    content: [],
    ...overrides,
  };
}

function makeStyle(
  overrides: Partial<NotebookModuleStyle> = {},
): NotebookModuleStyle {
  return {
    id: 'style-1',
    notebookId: 'nb-1',
    moduleType: 'Theory',
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderStyle: 'Solid',
    borderWidth: 2,
    borderRadius: 4,
    headerBgColor: '#EEEEEE',
    headerTextColor: '#222222',
    bodyTextColor: '#333333',
    fontFamily: 'Default',
    ...overrides,
  };
}

describe('ModuleCard', () => {
  it('positions the module using gridX/gridY/gridWidth/gridHeight and zoom', () => {
    const module = makeModule();
    render(
      <ModuleCard
        module={module}
        zoom={1}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );
    const card = screen.getByTestId(`module-card-${module.id}`);
    // GRID_BASE_UNIT_PX = 20
    expect(card.style.left).toBe('40px');
    expect(card.style.top).toBe('60px');
    expect(card.style.width).toBe('200px');
    expect(card.style.height).toBe('120px');
    expect(card.style.zIndex).toBe('5');
  });

  it('scales positions with zoom', () => {
    const module = makeModule();
    render(
      <ModuleCard
        module={module}
        zoom={1.5}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );
    const card = screen.getByTestId(`module-card-${module.id}`);
    // 2 * 20 * 1.5 = 60
    expect(card.style.left).toBe('60px');
    expect(card.style.top).toBe('90px');
    expect(card.style.width).toBe('300px');
    expect(card.style.height).toBe('180px');
  });

  it('applies the resolved NotebookModuleStyle to the module shell', () => {
    const module = makeModule();
    const style = makeStyle();
    render(
      <ModuleCard
        module={module}
        style={style}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );
    const card = screen.getByTestId(`module-card-${module.id}`);
    expect(card.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(card.style.borderRadius).toBe('4px');
    const header = screen.getByTestId(`module-card-header-${module.id}`);
    expect(header.style.backgroundColor).toBe('rgb(238, 238, 238)');
    expect(header.style.color).toBe('rgb(34, 34, 34)');
  });

  it('fires onSelect with the module id when clicked', () => {
    const module = makeModule();
    const onSelect = vi.fn();
    render(
      <ModuleCard
        module={module}
        isSelected={false}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByTestId(`module-card-${module.id}`));
    expect(onSelect).toHaveBeenCalledWith(module.id);
  });

  it('stops click propagation so the canvas surface does not deselect', () => {
    const module = makeModule();
    const onSurface = vi.fn();
    const { container } = render(
      <div onClick={onSurface} data-testid="surface">
        <ModuleCard
          module={module}
          isSelected={false}
          onSelect={vi.fn()}
        />
      </div>,
    );
    fireEvent.click(screen.getByTestId(`module-card-${module.id}`));
    expect(onSurface).not.toHaveBeenCalled();
    expect(container).toBeTruthy();
  });

  it('shows the selection outline and eight resize handles when selected', () => {
    const module = makeModule();
    render(
      <ModuleCard
        module={module}
        isSelected
        onSelect={vi.fn()}
      />,
    );
    const card = screen.getByTestId(`module-card-${module.id}`);
    expect(card.getAttribute('data-selected')).toBe('true');
    expect(card.getAttribute('aria-pressed')).toBe('true');
    expect(card.style.outline).toContain('solid');

    for (const handle of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
      expect(
        screen.getByTestId(`module-resize-handle-${handle}`),
      ).toBeTruthy();
    }
  });

  it('hides resize handles when not selected', () => {
    const module = makeModule();
    render(
      <ModuleCard
        module={module}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('module-resize-handle-n')).toBeNull();
    expect(screen.queryByTestId('module-resize-handle-se')).toBeNull();
  });

  it('renders the conflict overlay only when isConflicting is true', () => {
    const module = makeModule();
    const { rerender } = render(
      <ModuleCard
        module={module}
        isSelected={false}
        isConflicting={false}
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.queryByTestId(`module-conflict-overlay-${module.id}`),
    ).toBeNull();

    rerender(
      <ModuleCard
        module={module}
        isSelected={false}
        isConflicting
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId(`module-conflict-overlay-${module.id}`),
    ).toBeTruthy();
  });

  it('renders a header drag region with the localized label', () => {
    const module = makeModule();
    render(
      <ModuleCard
        module={module}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );
    const header = screen.getByTestId(`module-card-header-${module.id}`);
    expect(header.getAttribute('data-drag-handle')).toBe('true');
    expect(header.getAttribute('aria-label')).toBe('notebooks.canvas.dragHandle');
  });

  it('selects the module when Enter is pressed from keyboard focus', () => {
    const module = makeModule();
    const onSelect = vi.fn();
    render(
      <ModuleCard
        module={module}
        isSelected={false}
        onSelect={onSelect}
      />,
    );
    const card = screen.getByTestId(`module-card-${module.id}`);
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(module.id);
  });
});
