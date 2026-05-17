import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Notebook } from '@/types'
import { deleteNotebook } from '@/features/notebooks/api/notebooksApi'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { detail?: string } } }).response
    if (resp?.data?.detail) return resp.data.detail
  }
  return fallback
}

interface DeleteNotebookDialogProps {
  notebook: Notebook | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteNotebookDialog({ notebook, open, onOpenChange }: DeleteNotebookDialogProps) {
  const { t } = useTranslation('notebooks')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteNotebook(notebook!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t('errors.deleteFailed')))
    },
  })

  if (!notebook) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('delete.title', { name: notebook.title })}</DialogTitle>
          <DialogDescription>{t('delete.description')}</DialogDescription>
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
            {t('delete.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
