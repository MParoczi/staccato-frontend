import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbEmptyStateProps {
  className?: string;
}

/**
 * Empty-state panel shown for Breadcrumb modules in edit mode (UI-SPEC
 * §4.10). Breadcrumb content is auto-generated from sibling Subtitle
 * modules so there is nothing to edit; render a centered Info + copy.
 */
export function BreadcrumbEmptyState({ className }: BreadcrumbEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div
      role="note"
      aria-label={t('editor.breadcrumbAutoGen')}
      className={cn(
        'flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-6 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      <Info className="size-5" aria-hidden />
      <span>{t('editor.breadcrumbAutoGen')}</span>
    </div>
  );
}

