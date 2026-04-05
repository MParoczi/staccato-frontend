import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { User, Language, PageSize } from '@/lib/types';
import { useLanguageSwitch } from '../hooks/useLanguageSwitch';
import { useUpdatePreferences } from '../hooks/useUpdatePreferences';
import { useInstruments } from '@/hooks/useInstruments';

const PAGE_SIZE_OPTIONS: PageSize[] = ['A4', 'A5', 'A6', 'B5', 'B6'];

const NONE_VALUE = '__none__';

interface PreferencesSectionProps {
  user: User;
}

function useSaveConfirmation() {
  const [visible, setVisible] = useState(false);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, [visible]);

  return { visible, show };
}

function SaveCheckmark({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-green-600 animate-in fade-in duration-200 dark:text-green-400">
      <Check className="size-4" aria-hidden="true" />
    </span>
  );
}

export function PreferencesSection({ user }: PreferencesSectionProps) {
  const { t } = useTranslation();

  const languageMutation = useLanguageSwitch();
  const preferencesMutation = useUpdatePreferences();
  const {
    data: instruments,
    isError: instrumentsError,
    refetch: refetchInstruments,
  } = useInstruments();

  const langConfirm = useSaveConfirmation();
  const pageSizeConfirm = useSaveConfirmation();
  const instrumentConfirm = useSaveConfirmation();

  const handleLanguageChange = (value: string) => {
    const newLanguage = value as Language;
    if (newLanguage === user.language) return;
    languageMutation.mutate(newLanguage, {
      onSuccess: () => langConfirm.show(),
    });
  };

  const handlePageSizeChange = (value: string) => {
    const newPageSize = value === NONE_VALUE ? null : (value as PageSize);
    if (newPageSize === user.defaultPageSize) return;
    preferencesMutation.mutate(
      { field: 'defaultPageSize', value: newPageSize },
      { onSuccess: () => pageSizeConfirm.show() },
    );
  };

  const handleInstrumentChange = (value: string) => {
    const newInstrumentId = value === NONE_VALUE ? null : value;
    if (newInstrumentId === user.defaultInstrumentId) return;
    preferencesMutation.mutate(
      { field: 'defaultInstrumentId', value: newInstrumentId },
      { onSuccess: () => instrumentConfirm.show() },
    );
  };

  const selectedInstrumentInList =
    user.defaultInstrumentId &&
    instruments?.some((i) => i.id === user.defaultInstrumentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.preferences.title')}</CardTitle>
        <CardDescription>
          {t('profile.preferences.autoSaveNote')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Language selector */}
        <div className="grid gap-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="language-select">
              {t('profile.preferences.language')}
            </Label>
            <SaveCheckmark visible={langConfirm.visible} />
          </div>
          <Select
            value={user.language}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger id="language-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">
                {t('profile.preferences.languageEn')}
              </SelectItem>
              <SelectItem value="hu">
                {t('profile.preferences.languageHu')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page size selector */}
        <div className="grid gap-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="pagesize-select">
              {t('profile.preferences.pageSize')}
            </Label>
            <SaveCheckmark visible={pageSizeConfirm.visible} />
          </div>
          <Select
            value={user.defaultPageSize ?? NONE_VALUE}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger id="pagesize-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>
                {t('profile.preferences.none')}
              </SelectItem>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Instrument selector */}
        <div className="grid gap-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="instrument-select">
              {t('profile.preferences.instrument')}
            </Label>
            <SaveCheckmark visible={instrumentConfirm.visible} />
          </div>
          {instrumentsError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              <span>{t('profile.preferences.instrumentsError')}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-auto px-2 py-1"
                onClick={() => void refetchInstruments()}
              >
                <RefreshCw className="mr-1 size-3" aria-hidden="true" />
                {t('profile.preferences.retry')}
              </Button>
            </div>
          ) : (
            <Select
              value={
                selectedInstrumentInList && user.defaultInstrumentId
                  ? user.defaultInstrumentId
                  : NONE_VALUE
              }
              onValueChange={handleInstrumentChange}
            >
              <SelectTrigger id="instrument-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>
                  {t('profile.preferences.none')}
                </SelectItem>
                {instruments?.map((instrument) => (
                  <SelectItem key={instrument.id} value={instrument.id}>
                    {instrument.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
