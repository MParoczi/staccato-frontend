import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useInstruments } from '@/hooks/useInstruments';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useSystemPresets } from '../hooks/useSystemPresets';
import { useCreateNotebook } from '../hooks/useCreateNotebook';
import {
  createNotebookSchema,
  type CreateNotebookFormData,
} from '../schemas/create-notebook-schema';
import { DEFAULT_COVER_COLOR } from '@/lib/constants/notebook-colors';
import { StepBasics } from './StepBasics';
import { StepAppearance } from './StepAppearance';
import type { PageSize, CreateNotebookStyleInput } from '@/lib/types';

function stripPresetStyleIds(
  styles: Array<Record<string, unknown> & { id: string; notebookId: string }>,
): CreateNotebookStyleInput[] {
  return styles.map((style) => {
    const result = { ...style };
    delete result.id;
    delete result.notebookId;
    return result as CreateNotebookStyleInput;
  });
}

interface CreateNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateNotebookDialog({
  open,
  onOpenChange,
}: CreateNotebookDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const { data: user } = useCurrentUser();
  const instrumentsQuery = useInstruments({ enabled: open });
  const presetsQuery = useSystemPresets({ enabled: open });
  const createMutation = useCreateNotebook();

  const form = useForm<CreateNotebookFormData>({
    resolver: zodResolver(createNotebookSchema),
    defaultValues: {
      title: '',
      instrumentId: user?.defaultInstrumentId ?? '',
      pageSize: (user?.defaultPageSize ?? undefined) as PageSize | undefined,
      coverColor: DEFAULT_COVER_COLOR,
    },
  });

  const watchedCoverColor = useWatch({ control: form.control, name: 'coverColor' });

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset({
        title: '',
        instrumentId: user?.defaultInstrumentId ?? '',
        pageSize: (user?.defaultPageSize ?? undefined) as PageSize | undefined,
        coverColor: DEFAULT_COVER_COLOR,
      });
      setStep(1);
      setSelectedPresetId(null);
    }
    onOpenChange(isOpen);
  }

  function handleNext() {
    setStep(2);
  }

  function handleBack() {
    setStep(1);
  }

  function onSubmit(data: CreateNotebookFormData) {
    let styles: CreateNotebookStyleInput[] | undefined;

    if (selectedPresetId && presetsQuery.data) {
      const selected = presetsQuery.data.find((p) => p.id === selectedPresetId);
      if (selected) {
        styles = stripPresetStyleIds(selected.styles);
      }
    } else if (presetsQuery.data) {
      const defaultPreset = presetsQuery.data.find((p) => p.isDefault);
      if (defaultPreset) {
        styles = stripPresetStyleIds(defaultPreset.styles);
      }
    }

    createMutation.mutate(
      {
        title: data.title,
        instrumentId: data.instrumentId,
        pageSize: data.pageSize,
        coverColor: data.coverColor,
        styles,
      },
      {
        onError: () => {
          toast.error(t('notebooks.create.error'));
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('notebooks.create.title')}</DialogTitle>
          <DialogDescription>
            {step === 1
              ? t('notebooks.create.stepBasics')
              : t('notebooks.create.stepAppearance')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {step === 1 ? (
            <StepBasics
              register={form.register}
              watch={form.watch}
              errors={form.formState.errors}
              instruments={instrumentsQuery.data}
              instrumentsLoading={instrumentsQuery.isLoading}
              instrumentsError={instrumentsQuery.isError}
              instrumentsRefetch={instrumentsQuery.refetch}
              onInstrumentChange={(value) =>
                form.setValue('instrumentId', value, { shouldValidate: true })
              }
              onPageSizeChange={(value) =>
                form.setValue('pageSize', value, { shouldValidate: true })
              }
              onNext={handleNext}
            />
          ) : (
            <StepAppearance
              coverColor={watchedCoverColor}
              onCoverColorChange={(color) =>
                form.setValue('coverColor', color, { shouldValidate: true })
              }
              presets={presetsQuery.data}
              presetsLoading={presetsQuery.isLoading}
              presetsError={presetsQuery.isError}
              selectedPresetId={selectedPresetId}
              onPresetChange={setSelectedPresetId}
              onBack={handleBack}
              isPending={createMutation.isPending}
            />
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
