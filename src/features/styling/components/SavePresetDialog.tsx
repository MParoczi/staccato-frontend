import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { presetNameSchema } from '../utils/style-schema';

const savePresetFormSchema = z.object({
  name: presetNameSchema,
});

type SavePresetFormValues = z.infer<typeof savePresetFormSchema>;

interface SavePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the submitted (trimmed) preset name. */
  onSubmit: (name: string) => void;
  /** When true, disables form controls and shows a submitting label. */
  isSubmitting?: boolean;
  /**
   * When true, displays the inline duplicate-name error message under the
   * name input. The parent is responsible for clearing this (e.g., on
   * subsequent edits or successful submit) by toggling this prop.
   */
  hasDuplicateNameError?: boolean;
  /**
   * Bumping this value causes the dialog to clear its `duplicate` state on
   * the next render so the inline error is removed once the user edits the
   * name. A simple incrementing counter from the parent is sufficient.
   */
  clearDuplicateErrorKey?: number;
}

/**
 * Modal dialog that prompts for a user preset name and submits it for
 * creation. Uses React Hook Form + Zod for client-side validation of
 * required / max-length rules. Duplicate-name server errors (409) are
 * surfaced inline under the input via the `hasDuplicateNameError` prop.
 */
export function SavePresetDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  hasDuplicateNameError = false,
}: SavePresetDialogProps) {
  const { t } = useTranslation();

  const form = useForm<SavePresetFormValues>({
    resolver: zodResolver(savePresetFormSchema),
    defaultValues: { name: '' },
    mode: 'onSubmit',
  });

  // Reset the form whenever the dialog is reopened so stale values / errors
  // do not persist across invocations.
  useEffect(() => {
    if (open) {
      form.reset({ name: '' });
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values.name.trim());
  });

  const clientError = form.formState.errors.name?.message;
  const showDuplicate = hasDuplicateNameError && !clientError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-slot="save-preset-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t('styling.presets.saveDialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('styling.presets.saveDialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="save-preset-name">
              {t('styling.presets.nameLabel')}
            </Label>
            <Input
              id="save-preset-name"
              autoFocus
              placeholder={t('styling.presets.namePlaceholder')}
              aria-invalid={
                clientError || showDuplicate ? true : undefined
              }
              disabled={isSubmitting}
              data-slot="save-preset-name-input"
              {...form.register('name')}
            />
            {clientError && (
              <p
                className="text-xs text-destructive"
                data-slot="save-preset-name-error"
              >
                {t(clientError)}
              </p>
            )}
            {showDuplicate && (
              <p
                className="text-xs text-destructive"
                data-slot="save-preset-duplicate-error"
              >
                {t('styling.presets.duplicateName')}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              data-slot="save-preset-cancel"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-slot="save-preset-submit"
            >
              {isSubmitting
                ? t('styling.presets.saving')
                : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
