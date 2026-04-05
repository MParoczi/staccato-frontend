import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import type { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageSizeSelector } from './PageSizeSelector';
import type { CreateNotebookFormData } from '../schemas/create-notebook-schema';
import type { Instrument, PageSize } from '@/lib/types';

interface StepBasicsProps {
  register: UseFormRegister<CreateNotebookFormData>;
  watch: UseFormWatch<CreateNotebookFormData>;
  errors: FieldErrors<CreateNotebookFormData>;
  instruments: Instrument[] | undefined;
  instrumentsLoading: boolean;
  instrumentsError: boolean;
  instrumentsRefetch: () => void;
  onInstrumentChange: (value: string) => void;
  onPageSizeChange: (value: PageSize) => void;
  onNext: () => void;
}

export function StepBasics({
  register,
  watch,
  errors,
  instruments,
  instrumentsLoading,
  instrumentsError,
  instrumentsRefetch,
  onInstrumentChange,
  onPageSizeChange,
  onNext,
}: StepBasicsProps) {
  const { t } = useTranslation();

  const title = watch('title');
  const instrumentId = watch('instrumentId');
  const pageSize = watch('pageSize');

  const isValid =
    title?.trim().length > 0 &&
    instrumentId?.length > 0 &&
    pageSize !== undefined &&
    !instrumentsLoading;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="notebook-title">{t('notebooks.create.titleLabel')}</Label>
        <Input
          id="notebook-title"
          maxLength={200}
          aria-invalid={errors.title ? true : undefined}
          {...register('title')}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{t(errors.title.message as string)}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>{t('notebooks.create.instrumentLabel')}</Label>
        {instrumentsError ? (
          <div className="flex items-center gap-2">
            <p className="text-sm text-destructive">{t('profile.preferences.instrumentsError')}</p>
            <Button variant="outline" size="sm" onClick={() => instrumentsRefetch()}>
              {t('profile.preferences.retry')}
            </Button>
          </div>
        ) : (
          <Select
            value={instrumentId || ''}
            onValueChange={onInstrumentChange}
            disabled={instrumentsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('notebooks.create.instrumentLabel')} />
            </SelectTrigger>
            <SelectContent>
              {instruments?.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.instrumentId && (
          <p className="text-xs text-destructive">{t(errors.instrumentId.message as string)}</p>
        )}
      </div>

      <PageSizeSelector value={pageSize} onChange={onPageSizeChange} />
      {errors.pageSize && (
        <p className="-mt-2 text-xs text-destructive">{t(errors.pageSize.message as string)}</p>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
        <AlertTriangle className="size-4 shrink-0" />
        <span>{t('notebooks.create.immutabilityWarning')}</span>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext} disabled={!isValid}>
          {t('notebooks.create.next')}
        </Button>
      </div>
    </div>
  );
}
