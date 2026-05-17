import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BookOpen, Plus } from 'lucide-react'
import type { Notebook } from '@/types'
import { getNotebooks } from '@/features/notebooks/api/notebooksApi'
import { NotebookCard } from '@/features/notebooks/components/NotebookCard'
import { NotebookFormDialog } from '@/features/notebooks/components/NotebookFormDialog'
import { DeleteNotebookDialog } from '@/features/notebooks/components/DeleteNotebookDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function NotebooksPage() {
  const { t } = useTranslation('notebooks')
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [editNotebook, setEditNotebook] = useState<Notebook | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Notebook | null>(null)
  const { data: notebooks = [], isLoading } = useQuery({
    queryKey: ['notebooks'],
    queryFn: getNotebooks,
  })

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t('dashboard.createButton')}
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && notebooks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen className="mb-4 size-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold">{t('dashboard.empty')}</h2>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">{t('dashboard.emptyHint')}</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('dashboard.createButton')}
          </Button>
        </div>
      )}

      {!isLoading && notebooks.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {notebooks.map((notebook) => (
            <NotebookCard
              key={notebook.id}
              notebook={notebook}
              onOpen={() => navigate(`/app/notebooks/${notebook.id}`)}
              onSettings={() => setEditNotebook(notebook)}
              onDelete={() => setDeleteTarget(notebook)}
            />
          ))}
          <Card
            className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 bg-transparent text-muted-foreground shadow-none transition-colors hover:border-primary/50 hover:text-primary"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mb-1 size-6" />
            <span className="text-sm font-medium">{t('dashboard.newSlotLabel')}</span>
          </Card>
        </div>
      )}

      <NotebookFormDialog open={createOpen} mode="create" onOpenChange={setCreateOpen} />
      <NotebookFormDialog
        open={!!editNotebook}
        mode="edit"
        notebook={editNotebook ?? undefined}
        onOpenChange={(open) => {
          if (!open) setEditNotebook(null)
        }}
      />
      <DeleteNotebookDialog
        notebook={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      />
    </div>
  )
}
