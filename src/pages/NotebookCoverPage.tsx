import { useOutletContext } from 'react-router'
import type { Notebook } from '@/types'

interface NotebookOutletContext {
  notebook: Notebook
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
}

export default function NotebookCoverPage() {
  const { notebook } = useOutletContext<NotebookOutletContext>()
  const textColor = getContrastColor(notebook.coverColor)

  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center px-8 py-16"
      style={{ backgroundColor: notebook.coverColor, color: textColor }}
    >
      <h1 className="mb-3 text-center text-4xl font-bold">{notebook.title}</h1>
      <p className="text-lg opacity-70">Guitar</p>
    </div>
  )
}
