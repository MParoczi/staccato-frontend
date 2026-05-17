import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BookOpen, MoreHorizontal } from 'lucide-react'
import type { Lesson } from '@/types'
import { getLessons } from '@/features/lessons/api/lessonsApi'
import { CreateLessonDialog } from '@/features/lessons/components/CreateLessonDialog'
import { RenameLessonDialog } from '@/features/lessons/components/RenameLessonDialog'
import { DeleteLessonDialog } from '@/features/lessons/components/DeleteLessonDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function LessonsPage() {
  const { t } = useTranslation('lessons')
  const { id: notebookId } = useParams<{ id: string }>()

  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Lesson | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null)

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', notebookId],
    queryFn: () => getLessons(notebookId!),
    enabled: !!notebookId,
  })

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">{t('list.title')}</h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          {t('list.newLessonButton')}
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-4 space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      )}

      {/* Lesson list */}
      {!isLoading && (
        <div className="flex flex-col">
          {/* Dashed first-slot row — always visible */}
          <button
            type="button"
            className="flex items-center px-4 py-3 border-dashed border border-muted text-muted-foreground hover:bg-accent/40 transition-colors text-sm"
            onClick={() => setCreateOpen(true)}
          >
            {t('list.newSlotLabel')}
          </button>

          {/* Empty state */}
          {lessons?.length === 0 && (
            <div className="py-16 text-center">
              <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="font-semibold">{t('list.empty')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('list.emptyHint')}</p>
            </div>
          )}

          {/* Lesson rows */}
          {lessons?.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors border-b last:border-b-0"
            >
              {/* Left: clickable lesson info */}
              <Link
                to={`/app/notebooks/${notebookId}/lessons/${lesson.id}`}
                className="flex flex-col flex-1 min-w-0"
              >
                <span className="font-semibold truncate">{lesson.title}</span>
                <span className="text-xs text-muted-foreground">
                  {t('pageCount', { count: lesson.pageCount })}
                </span>
              </Link>

              {/* Right: ⋮ dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Lesson actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/app/notebooks/${notebookId}/lessons/${lesson.id}`}>
                      {t('actions.open')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRenameTarget(lesson)}>
                    {t('actions.rename')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteTarget(lesson)}
                  >
                    {t('actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateLessonDialog
        notebookId={notebookId!}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <RenameLessonDialog
        lesson={renameTarget}
        notebookId={notebookId!}
        open={!!renameTarget}
        onOpenChange={(open) => { if (!open) setRenameTarget(null) }}
      />
      <DeleteLessonDialog
        lesson={deleteTarget}
        notebookId={notebookId!}
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      />
    </div>
  )
}
