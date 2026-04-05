import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateLesson } from '../hooks/useUpdateLesson';
import { DeleteLessonDialog } from './DeleteLessonDialog';
import {
  lessonTitleSchema,
  type LessonTitleFormData,
} from '../schemas/lesson-title-schema';
import type { LessonSummary } from '@/lib/types';

interface LessonSidebarEntryProps {
  lesson: LessonSummary;
  notebookId: string;
  isActive: boolean;
  onNavigate: (lessonId: string) => void;
  onDeleted?: () => void;
}

export function LessonSidebarEntry({
  lesson,
  notebookId,
  isActive,
  onNavigate,
  onDeleted,
}: LessonSidebarEntryProps) {
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateLesson(notebookId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LessonTitleFormData>({
    resolver: zodResolver(lessonTitleSchema),
    defaultValues: { title: lesson.title },
  });

  const { ref: formRef, ...registerRest } = register('title');

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleStartEdit(e: React.MouseEvent) {
    e.stopPropagation();
    reset({ title: lesson.title });
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    reset({ title: lesson.title });
  }

  function onSubmit(data: LessonTitleFormData) {
    if (data.title === lesson.title) {
      setIsEditing(false);
      return;
    }
    updateMutation.mutate(
      { lessonId: lesson.id, title: data.title },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
        onError: () => {
          reset({ title: lesson.title });
          setIsEditing(false);
          toast.error(t('notebooks.shell.sidebar.editError'));
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }

  function handleRowClick() {
    if (isEditing) return;
    onNavigate(lesson.id);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteOpen(true);
  }

  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(lesson.createdAt));

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isEditing) handleRowClick();
        }}
        className={`group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 transition-colors ${
          isActive
            ? 'bg-[hsl(var(--accent))] text-accent-foreground'
            : 'hover:bg-muted/60'
        }`}
      >
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <form
              onSubmit={handleSubmit(onSubmit)}
              onBlur={handleSubmit(onSubmit)}
              className="flex flex-col gap-1"
            >
              <Input
                {...registerRest}
                ref={(e) => {
                  formRef(e);
                  (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                }}
                onKeyDown={handleKeyDown}
                className="h-7 text-sm"
                aria-invalid={errors.title ? true : undefined}
                aria-label={t('notebooks.shell.sidebar.editTitle')}
              />
            </form>
          ) : (
            <>
              <p className="truncate text-sm font-semibold">
                {lesson.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {formattedDate}
              </p>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleStartEdit}
              aria-label={t('notebooks.shell.sidebar.editTitle')}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              onClick={handleDeleteClick}
              aria-label={t('notebooks.shell.sidebar.deleteLesson')}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <DeleteLessonDialog
        lesson={lesson}
        notebookId={notebookId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={onDeleted}
      />
    </>
  );
}
