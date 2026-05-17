import { useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2 } from 'lucide-react'
import { getLesson } from '@/features/lessons/api/lessonsApi'
import { getLessonPages, addPage } from '@/features/lessons/api/lessonPagesApi'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DeletePageDialog } from '@/features/lessons/components/DeletePageDialog'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { detail?: string } } }).response
    if (resp?.data?.detail) return resp.data.detail
  }
  return fallback
}

export default function LessonPage() {
  const { t } = useTranslation('lessons')
  const { id: notebookId, lessonId } = useParams<{ id: string; lessonId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId!),
    enabled: !!lessonId,
  })

  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ['lessonPages', lessonId],
    queryFn: () => getLessonPages(lessonId!),
    enabled: !!lessonId,
  })

  const totalPages = pages?.length ?? 1
  const activePage = pages?.[currentPage - 1] ?? null
  const canDeletePage = totalPages > 1
  const globalPageNumber =
    activePage?.globalPageNumber ?? ((lesson?.globalPageStart ?? 0) + currentPage - 1)

  const goToPrev = () => setSearchParams({ page: String(currentPage - 1) })
  const goToNext = () => setSearchParams({ page: String(currentPage + 1) })

  const addPageMutation = useMutation({
    mutationFn: () => addPage(lessonId!),
    onSuccess: (newPage) => {
      setSearchParams({ page: String(newPage.pageNumber) })
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
      queryClient.invalidateQueries({ queryKey: ['lessonPages', lessonId] })
      queryClient.invalidateQueries({ queryKey: ['lessons', notebookId] })
      if (newPage.pageNumber === 10) {
        toast.warning(t('warnings.tenPages'))
      }
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t('errors.addPageFailed')))
    },
  })

  const [deletePageOpen, setDeletePageOpen] = useState(false)
  const handlePageDeleted = () => {
    const newPage = currentPage > 1 ? currentPage - 1 : 1
    setSearchParams({ page: String(newPage) })
  }

  if (lessonLoading || pagesLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Top controls bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background flex-wrap">
        {/* Back link — left side */}
        <Link
          to={`/app/notebooks/${notebookId}/lessons`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ChevronLeft className="size-4" />
          {t('actions.backToLessons')}
        </Link>

        <Separator orientation="vertical" className="h-4 shrink-0" />

        {/* Lesson title */}
        <span className="text-sm font-medium truncate max-w-[200px]">
          {lesson?.title ?? '…'}
        </span>

        {/* Right-side controls — push to right */}
        <div className="flex items-center gap-1 ml-auto flex-wrap">
          {/* Page position */}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t('page.pageOf', { current: currentPage, total: totalPages })}
          </span>
          <Separator orientation="vertical" className="h-4 shrink-0" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t('page.globalPage', { number: globalPageNumber })}
          </span>
          <Separator orientation="vertical" className="h-4 shrink-0" />

          {/* Prev / Next */}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={currentPage <= 1}
            onClick={goToPrev}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={currentPage >= totalPages}
            onClick={goToNext}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Separator orientation="vertical" className="h-4 shrink-0" />

          {/* Add page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addPageMutation.mutate()}
            disabled={addPageMutation.isPending}
            aria-label={t('actions.addPage')}
          >
            {addPageMutation.isPending ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : (
              <Plus className="size-4 mr-1" />
            )}
            <span className="hidden sm:inline">{t('actions.addPage')}</span>
          </Button>

          {/* Delete page */}
          <Button
            variant="ghost"
            size="sm"
            disabled={!canDeletePage}
            onClick={() => setDeletePageOpen(true)}
            aria-label={t('actions.deletePage')}
          >
            <Trash2 className="size-4 mr-1" />
            <span className="hidden sm:inline">{t('actions.deletePage')}</span>
          </Button>
        </div>
      </div>

      {/* Canvas placeholder — dotted-grid CSS background */}
      <div
        className="min-h-[70vh]"
        style={{
          backgroundImage:
            'radial-gradient(circle, hsl(var(--muted-foreground) / 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundColor: 'hsl(var(--background))',
        }}
      />

      <DeletePageDialog
        lessonId={lessonId!}
        notebookId={notebookId!}
        pageId={activePage?.id ?? null}
        open={deletePageOpen}
        onOpenChange={setDeletePageOpen}
        onDeleted={handlePageDeleted}
      />
    </div>
  )
}
