import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreate: () => void;
}

export function EmptyState({ onCreate }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <BookOpen className="mb-4 size-16 text-muted-foreground/60" />
      <h2 className="mb-2 text-lg font-medium text-foreground">
        {t('notebooks.dashboard.emptyTitle')}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        {t('notebooks.dashboard.emptyMessage')}
      </p>
      <Button onClick={onCreate}>
        {t('notebooks.dashboard.emptyAction')}
      </Button>
    </div>
  );
}
