import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Notebook } from '@/types'
import { COVER_COLORS, NOTEBOOK_STYLE_PRESETS, NOTEBOOK_PAGE_SIZES } from '@/types'
import { createNotebook, updateNotebook } from '@/features/notebooks/api/notebooksApi'
import { useAuthStore } from '@/stores/authStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { detail?: string } } }).response
    if (resp?.data?.detail) return resp.data.detail
  }
  return fallback
}

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  coverColor: z.string(),
  pageSize: z.string(),
  stylePreset: z.string(),
})
type FormValues = z.infer<typeof schema>

interface NotebookFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  notebook?: Notebook
}

const PRESET_STYLES: Record<string, string> = {
  Classic: 'bg-neutral-100 border border-neutral-300',
  Colorful: 'bg-blue-100 border-2 border-blue-400',
  Dark: 'bg-zinc-800 border border-zinc-600',
  Minimal: 'bg-white border border-zinc-200',
  Pastel: 'bg-pink-100 border border-pink-300',
}

export function NotebookFormDialog({
  open,
  onOpenChange,
  mode,
  notebook,
}: NotebookFormDialogProps) {
  const { t } = useTranslation('notebooks')
  const queryClient = useQueryClient()
  const userDefaultPageSize = useAuthStore((s) => s.user?.defaultPageSize)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      coverColor: COVER_COLORS[0],
      pageSize: userDefaultPageSize ?? 'A4',
      stylePreset: 'Classic',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        mode === 'edit' && notebook
          ? {
              title: notebook.title,
              coverColor: notebook.coverColor,
              pageSize: notebook.pageSize,
              stylePreset: notebook.stylePreset,
            }
          : {
              title: '',
              coverColor: COVER_COLORS[0],
              pageSize: userDefaultPageSize ?? 'A4',
              stylePreset: 'Classic',
            },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentionally fires only on open — form is stable, mode/notebook/userDefaultPageSize captured at open time
  }, [open])

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      createNotebook({
        title: values.title,
        coverColor: values.coverColor,
        pageSize: values.pageSize,
        stylePreset: values.stylePreset,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t('errors.createFailed')))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateNotebook(notebook!.id, {
        title: values.title,
        coverColor: values.coverColor,
        pageSize: values.pageSize,
        stylePreset: values.stylePreset,
      }),
    onSuccess: (updatedNotebook) => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      queryClient.setQueryData(['notebooks', notebook!.id], updatedNotebook)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, t('errors.updateFailed')))
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  function onSubmit(values: FormValues) {
    if (mode === 'create') {
      createMutation.mutate(values)
    } else {
      updateMutation.mutate(values)
    }
  }

  const dialogTitle = mode === 'create' ? t('create.title') : t('edit.title')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('create.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover color picker */}
            <FormField
              control={form.control}
              name="coverColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.coverColor')}</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {COVER_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 rounded-full transition-all ${field.value === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                          aria-label={`Color ${color}`}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Style preset picker */}
            <FormField
              control={form.control}
              name="stylePreset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.stylePreset')}</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {NOTEBOOK_STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => field.onChange(preset)}
                          className="flex flex-col items-center gap-1"
                          aria-label={preset}
                        >
                          <div
                            className={`w-12 h-9 rounded cursor-pointer ${PRESET_STYLES[preset]} ${field.value === preset ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {t(`presets.${preset}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instrument (disabled — hardcoded Guitar per CLAUDE.md) */}
            <FormItem>
              <FormLabel>{t('fields.instrument')}</FormLabel>
              <Select value="guitar" disabled>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guitar">Guitar</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            {/* Page size */}
            <FormField
              control={form.control}
              name="pageSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.pageSize')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NOTEBOOK_PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('actions.saving')}
                  </>
                ) : (
                  dialogTitle
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
