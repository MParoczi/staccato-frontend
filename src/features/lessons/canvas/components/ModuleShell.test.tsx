import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DndContext } from '@dnd-kit/core'
import { ModuleShell } from './ModuleShell'
import type { Module } from '@/types'

const baseModule: Module = {
  id: 'mod-1',
  pageId: 'page-1',
  moduleType: 'TextBlock',
  gridX: 2, gridY: 3, gridWidth: 6, gridHeight: 4,
  zIndex: 1,
  content: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderShell(overrides: Partial<Parameters<typeof ModuleShell>[0]> = {}) {
  const props = {
    module: baseModule,
    isSelected: false,
    scale: 1,
    maxCols: 24,
    maxRows: 35,
    onSelect: vi.fn(),
    onBringForward: vi.fn(),
    onSendBackward: vi.fn(),
    onDeleteRequest: vi.fn(),
    onResize: vi.fn(),
    onResizeCommit: vi.fn(),
    ...overrides,
  }
  return render(
    <DndContext>
      <ModuleShell {...props} />
    </DndContext>
  )
}

describe('ModuleShell', () => {
  it('renders the module type label', () => {
    renderShell()
    expect(screen.getByText('Text Block')).toBeInTheDocument()
  })

  it('applies the per-type header color via inline style', () => {
    const { container } = renderShell()
    // Header div has background set via style prop — check that a div with
    // background style containing the TextBlock color exists.
    // JSDOM may serialize hex to rgb, so check computed style instead.
    const allDivs = container.querySelectorAll('div')
    const headerDiv = Array.from(allDivs).find((div) => {
      const bg = div.style.background || div.style.backgroundColor
      // Accept either hex or rgb form of #3b82f6 = rgb(59, 130, 246)
      return bg.includes('#3b82f6') || bg.includes('rgb(59, 130, 246)')
    })
    expect(headerDiv).toBeTruthy()
  })

  it('does not show FloatingActionBar when not selected', () => {
    renderShell({ isSelected: false })
    expect(screen.queryByTitle('Bring forward')).toBeNull()
  })

  it('shows FloatingActionBar when selected', () => {
    renderShell({ isSelected: true })
    expect(screen.getByTitle('Bring forward')).toBeInTheDocument()
    expect(screen.getByTitle('Send backward')).toBeInTheDocument()
    expect(screen.getByTitle('Delete module')).toBeInTheDocument()
  })

  it('calls onSelect with module id when clicked', () => {
    const onSelect = vi.fn()
    const { container } = renderShell({ onSelect })
    // The ModuleShell div is the first child inside the DndContext wrapper
    const shellDiv = container.querySelector('[style*="position: absolute"]') as HTMLElement
    fireEvent.click(shellDiv)
    expect(onSelect).toHaveBeenCalledWith('mod-1')
  })

  it('shows 8 resize handle stubs when selected', () => {
    const { container } = renderShell({ isSelected: true })
    const handles = container.querySelectorAll('[data-resize-handle]')
    expect(handles).toHaveLength(8)
  })
})
