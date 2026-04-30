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
 * Anchored just outside the module's top-right corner (above the body,
 * to the right of the header) so it never overlaps the header label or
 * the corner resize handle. Uses `secondary` variant + ring + shadow for
 * high contrast against arbitrary module background colors (the chip was
 * previously near-invisible against dark module headers — bug audit
 * 2026-04-30).
 *
 * Activates on click + Enter + Space (native button behavior). The
 * trigger sets `data-prevent-edit-entry="true"` so click gestures on the
 * parent ModuleCard don't double-fire the entry path.
 */
export function EditButton({ onActivate, className }: EditButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      data-prevent-edit-entry="true"
      aria-label={t('editor.edit')}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      className={
        className ??
        // Anchor: top-right inside the header strip. Strong contrast
        // (secondary variant + ring + shadow) so the chip is visible on
        // any header background color the user picked. Pill shape +
        // explicit "Edit" label disambiguates from the resize handle in
        // the corner.
        'absolute right-1.5 top-1 z-10 h-6 gap-1 rounded-full px-2 text-[11px] leading-none shadow-sm ring-1 ring-border'
      }
    >
      <Pencil className="size-3.5" aria-hidden />
      <span>{t('editor.edit')}</span>
    </Button>
  );
}




