import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CoverColorPicker } from './CoverColorPicker';
import { useUpdateNotebook } from '../hooks/useUpdateNotebook';
import {
  editNotebookSchema,
  type EditNotebookFormData,
} from '../schemas/edit-notebook-schema';
import type { NotebookDetail } from '@/lib/types';

interface EditNotebookDialogProps {
  notebook: NotebookDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditNotebookDialog({
  notebook,
  open,
  onOpenChange,
}: EditNotebookDialogProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateNotebook(notebook.id);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<EditNotebookFormData>({
    resolver: zodResolver(editNotebookSchema),
    defaultValues: {
      title: notebook.title,
      coverColor: notebook.coverColor,
    },
  });

  const watchedCoverColor = useWatch({ control, name: 'coverColor' });

  // Reset form when dialog opens or notebook data changes
  useEffect(() => {
    if (open) {
      reset({
        title: notebook.title,
        coverColor: notebook.coverColor,
      });
    }
  }, [open, notebook.title, notebook.coverColor, reset]);

  function onSubmit(data: EditNotebookFormData) {
    updateMutation.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
      },
      onError: () => {
        toast.error(t('notebooks.shell.edit.error'));
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('notebooks.shell.edit.title')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('notebooks.shell.edit.title')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-notebook-title">
              {t('notebooks.shell.edit.titleLabel')}
            </Label>
            <Input
              id="edit-notebook-title"
              {...register('title')}
              aria-invalid={errors.title ? true : undefined}
            />
            {errors.title && (
              <p className="text-xs text-destructive">
                {t(errors.title.message ?? '')}
              </p>
            )}
          </div>

          {/* Cover Color */}
          <CoverColorPicker
            value={watchedCoverColor}
            onChange={(color) =>
              setValue('coverColor', color, { shouldValidate: true })
            }
          />
          {errors.coverColor && (
            <p className="text-xs text-destructive">
              {t(errors.coverColor.message ?? '')}
            </p>
          )}

          {/* Instrument (read-only) */}
          <div className="space-y-2">
            <Label>{t('notebooks.shell.edit.instrumentLabel')}</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <span>{notebook.instrumentName}</span>
              <Lock className="ml-auto size-3.5 text-muted-foreground/60" aria-hidden="true" />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('notebooks.shell.edit.immutabilityNotice')}
            </p>
          </div>

          {/* Page Size (read-only) */}
          <div className="space-y-2">
            <Label>{t('notebooks.shell.edit.pageSizeLabel')}</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <span>{notebook.pageSize}</span>
              <Lock className="ml-auto size-3.5 text-muted-foreground/60" aria-hidden="true" />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('notebooks.shell.edit.immutabilityNotice')}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? t('notebooks.shell.edit.submitting')
                : t('notebooks.shell.edit.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
