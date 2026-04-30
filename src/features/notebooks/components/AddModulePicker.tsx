import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  CircleAlert,
  CircleQuestionMark,
  ClipboardList,
  Guitar,
  Heading,
  Info,
  Lightbulb,
  Music,
  Navigation,
  Pencil,
  Plus,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ModuleType } from '@/lib/types';

/**
 * Twelve module types in display order. Each entry maps to a Lucide icon
 * and a `styling.moduleTypes.*` translation key so labels stay
 * consistent with the styling drawer.
 */
const MODULE_TYPE_ENTRIES: ReadonlyArray<{
  moduleType: ModuleType;
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  labelKey: string;
}> = [
  { moduleType: 'Title', Icon: Heading, labelKey: 'styling.moduleTypes.title' },
  { moduleType: 'Breadcrumb', Icon: Navigation, labelKey: 'styling.moduleTypes.breadcrumb' },
  { moduleType: 'Subtitle', Icon: Type, labelKey: 'styling.moduleTypes.subtitle' },
  { moduleType: 'Theory', Icon: BookOpen, labelKey: 'styling.moduleTypes.theory' },
  { moduleType: 'Practice', Icon: Music, labelKey: 'styling.moduleTypes.practice' },
  { moduleType: 'Example', Icon: Lightbulb, labelKey: 'styling.moduleTypes.example' },
  { moduleType: 'Important', Icon: CircleAlert, labelKey: 'styling.moduleTypes.important' },
  { moduleType: 'Tip', Icon: Info, labelKey: 'styling.moduleTypes.tip' },
  { moduleType: 'Homework', Icon: ClipboardList, labelKey: 'styling.moduleTypes.homework' },
  { moduleType: 'Question', Icon: CircleQuestionMark, labelKey: 'styling.moduleTypes.question' },
  { moduleType: 'ChordTablature', Icon: Guitar, labelKey: 'styling.moduleTypes.chordTablature' },
  { moduleType: 'FreeText', Icon: Pencil, labelKey: 'styling.moduleTypes.freeText' },
];

interface AddModulePickerProps {
  /**
   * Called when the user picks a type. The owner is responsible for
   * computing the first-fit position, dispatching the create mutation,
   * and surfacing any "no space available" toast.
   */
  onSelectType: (moduleType: ModuleType) => void;
  /**
   * Disable the trigger when no page is loaded (router transition states)
   * so keyboard users still get a focusable button without firing into a
   * missing page context.
   */
  disabled?: boolean;
}

/**
 * Keyboard-accessible 12-type module picker with labeled icons.
 *
 * Selecting a type immediately invokes `onSelectType` and closes the
 * dialog so the create flow can begin without a separate confirm step,
 * matching the spec's immediate first-fit placement clarification.
 */
export function AddModulePicker({
  onSelectType,
  disabled = false,
}: AddModulePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handlePick = useCallback(
    (moduleType: ModuleType) => {
      setOpen(false);
      onSelectType(moduleType);
    },
    [onSelectType],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={t('notebooks.canvas.addModule.trigger')}
          data-testid="add-module-trigger"
        >
          <Plus className="mr-1 size-4" aria-hidden="true" />
          {t('notebooks.canvas.addModule.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('notebooks.canvas.addModule.title')}</DialogTitle>
          <DialogDescription>
            {t('notebooks.canvas.addModule.description')}
          </DialogDescription>
        </DialogHeader>
        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label={t('notebooks.canvas.addModule.title')}
        >
          {MODULE_TYPE_ENTRIES.map(({ moduleType, Icon, labelKey }) => {
            const label = t(labelKey);
            return (
              <Button
                key={moduleType}
                type="button"
                variant="outline"
                className="flex h-auto flex-col items-center gap-2 px-2 py-3"
                onClick={() => handlePick(moduleType)}
                aria-label={label}
                data-testid={`add-module-option-${moduleType}`}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="text-xs">{label}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
