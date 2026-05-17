import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteModuleDialog } from './DeleteModuleDialog'

describe('DeleteModuleDialog', () => {
  it('renders the dialog when open', () => {
    render(
      <DeleteModuleDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByText('Delete module')).toBeInTheDocument()
    expect(screen.getByText(/permanently deleted/)).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <DeleteModuleDialog
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.queryByText('Delete module')).toBeNull()
  })

  it('calls onConfirm when Delete button is clicked', async () => {
    const onConfirm = vi.fn()
    render(
      <DeleteModuleDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /^Delete$/ }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onOpenChange(false) when Cancel is clicked', async () => {
    const onOpenChange = vi.fn()
    render(
      <DeleteModuleDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables buttons when isPending', () => {
    render(
      <DeleteModuleDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={true}
      />
    )
    const deleteBtn = screen.getByRole('button', { name: /^Delete/ })
    expect(deleteBtn).toBeDisabled()
  })
})
