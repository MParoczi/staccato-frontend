import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
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
import { useCreateLesson } from '../hooks/useCreateLesson';
import {
  lessonTitleSchema,
  type LessonTitleFormData,
} from '../schemas/lesson-title-schema';
import type { LessonDetail } from '@/lib/types';

interface CreateLessonDialogProps {
  notebookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (lesson: LessonDetail) => void;
}

export function CreateLessonDialog({
  notebookId,
  open,
  onOpenChange,
  onCreated,
}: CreateLessonDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateLesson(notebookId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LessonTitleFormData>({
    resolver: zodResolver(lessonTitleSchema),
    defaultValues: { title: '' },
  });

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      reset({ title: '' });
    }
    onOpenChange(isOpen);
  }

  function onSubmit(data: LessonTitleFormData) {
    createMutation.mutate(data, {
      onSuccess: (lesson) => {
        handleOpenChange(false);
        onCreated?.(lesson);
        if (lesson.pages.length > 0) {
          void navigate(
            `/app/notebooks/${notebookId}/lessons/${lesson.id}/pages/${lesson.pages[0].id}`,
          );
        }
      },
      onError: () => {
        toast.error(t('notebooks.shell.createLesson.error'));
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('notebooks.shell.createLesson.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('notebooks.shell.createLesson.title')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-lesson-title">
              {t('notebooks.shell.createLesson.titleLabel')}
            </Label>
            <Input
              id="create-lesson-title"
              {...register('title')}
              aria-invalid={errors.title ? true : undefined}
              autoFocus
            />
            {errors.title && (
              <p className="text-xs text-destructive">
                {t(errors.title.message ?? '')}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? t('notebooks.shell.createLesson.submitting')
                : t('notebooks.shell.createLesson.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
