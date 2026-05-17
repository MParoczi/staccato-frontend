import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Lesson } from '@/types'
import { createLesson } from '@/features/lessons/api/lessonsApi'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { detail?: string } } }).response
    if (resp?.data?.detail) return resp.data.detail
  }
  return fallback
}

const schema = z.object({ title: z.string().min(1, 'Title is required') })
type FormValues = z.infer<typeof schema>

interface CreateLessonDialogProps {
  notebookId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLessonDialog({ notebookId, open, onOpenChange }: CreateLessonDialogProps) {
  const { t } = useTranslation('lessons')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '' },
  })

  useEffect(() => {
    if (open) form.reset({ title: '' })
  }, [open, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createLesson(notebookId, { title: values.title.trim() }),
    onSuccess: (newLesson: Lesson) => {
      queryClient.invalidateQueries({ queryKey: ['lessons', notebookId] })
      onOpenChange(false)
      void navigate(`/app/notebooks/${notebookId}/lessons/${newLesson.id}`)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t('errors.createFailed')))
    },
  })

  function onSubmit(values: FormValues) {
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('create.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('create.titleLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('create.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t('create.submitButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
