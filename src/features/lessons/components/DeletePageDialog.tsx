import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { deletePage } from '@/features/lessons/api/lessonPagesApi'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { detail?: string } } }).response
    if (resp?.data?.detail) return resp.data.detail
  }
  return fallback
}

interface DeletePageDialogProps {
  lessonId: string
  notebookId: string
  pageId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeletePageDialog({
  lessonId,
  notebookId,
  pageId,
  open,
  onOpenChange,
  onDeleted,
}: DeletePageDialogProps) {
  const { t } = useTranslation('lessons')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deletePage(lessonId, pageId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
      queryClient.invalidateQueries({ queryKey: ['lessonPages', lessonId] })
      queryClient.invalidateQueries({ queryKey: ['lessons', notebookId] })
      onDeleted()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t('errors.deletePageFailed')))
    },
  })

  if (!pageId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deletePage.title')}</DialogTitle>
          <DialogDescription>{t('deletePage.description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('cancel', { ns: 'common' })}
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('deletePage.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
