import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentSaveStatus } from '@/features/notebooks/hooks/useModuleContentMutation';

export interface SaveIndicatorProps {
  status: ContentSaveStatus;
  className?: string;
}

/**
 * Editor save indicator (UI-SPEC §4.6). Idle → renders nothing. Saving →
 * spinner + "Saving…". Saved → check + "Saved" (auto-fades after 1.5s via
 * an internal timer; the parent hook also resets to idle after the same
 * window — both safe to coexist). Failed → destructive AlertCircle +
 * "Couldn't save".
 *
 * `aria-live="polite"` for non-error states; `role="alert"` for errors so
 * AT users hear failures immediately.
 */
export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  const { t } = useTranslation();
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (status === 'saved') {
      // Plan 01-05 task 5.3: auto-fade the saved chip after 1500ms even
      // when the parent's auto-idle timer is short-circuited (e.g. mutation
      // hook unmounted). The setState-in-effect rule is acknowledged and
      // intentional here — the trigger is an external prop (`status`),
      // not derived state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSaved(true);
      const id = setTimeout(() => setShowSaved(false), 1500);
      return () => clearTimeout(id);
    }
    setShowSaved(false);
    return undefined;
  }, [status]);

  if (status === 'idle' || (status === 'saved' && !showSaved)) return null;

  if (status === 'failed') {
    return (
      <span
        role="alert"
        className={cn(
          'inline-flex items-center gap-1 text-xs text-destructive',
          className,
        )}
      >
        <AlertCircle className="size-3.5" aria-hidden />
        {t('editor.saveFailed')}
      </span>
    );
  }

  if (status === 'saving') {
    return (
      <span
        role="status"
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-1 text-xs text-muted-foreground',
          className,
        )}
      >
        <Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden />
        {t('editor.saving')}
      </span>
    );
  }

  // saved
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1 text-xs text-muted-foreground',
        className,
      )}
    >
      <Check className="size-3.5" aria-hidden />
      {t('editor.saved')}
    </span>
  );
}

