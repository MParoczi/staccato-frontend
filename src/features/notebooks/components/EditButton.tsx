import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EditButtonProps {
  onActivate: () => void;
  className?: string;
}

/**
 * Explicit Edit affordance for a selected module (UI-SPEC §4.1).
 *
 * Anchored top-right; ghost variant; activates on click + Enter + Space
 * (native button behavior). Native HTML `button` activates on Space/Enter
 * for free; the redundant `aria-label` ensures consistent SR readout.
 *
 * The trigger sets `data-prevent-edit-entry="true"` so click gestures on
 * the parent ModuleCard don't double-fire the entry path.
 */
export function EditButton({ onActivate, className }: EditButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-prevent-edit-entry="true"
      aria-label={t('editor.edit')}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      className={className ?? 'absolute right-2 top-2 size-7'}
    >
      <Pencil className="size-3.5" aria-hidden />
    </Button>
  );
}

