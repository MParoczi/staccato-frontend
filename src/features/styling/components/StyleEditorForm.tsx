import { useEffect, useState } from 'react';
import { FormProvider, useForm, useFormState, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type {
  ModuleType,
  NotebookModuleStyle,
  UpdateNotebookStyleInput,
} from '@/lib/types';
import { MODULE_STYLE_TAB_ORDER } from '../utils/style-defaults';
import {
  styleEditorSchema,
  type ModuleStyleFormValues,
  type StyleEditorFormValues,
} from '../utils/style-schema';
import { useSaveNotebookStyles } from '../hooks/useStyleMutations';
import { StyleEditorTab } from './StyleEditorTab';
import { StylePreview } from './StylePreview';

interface StyleEditorFormProps {
  notebookId: string;
  styles: readonly NotebookModuleStyle[];
  serverKey: number;
  registerCloseReset: (handler: () => void) => void;
}

function moduleTypeKey(moduleType: ModuleType): string {
  return moduleType.charAt(0).toLowerCase() + moduleType.slice(1);
}

function styleToFormValues(
  style: NotebookModuleStyle,
): ModuleStyleFormValues {
  return {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderStyle: style.borderStyle,
    borderWidth: style.borderWidth,
    borderRadius: style.borderRadius,
    headerBgColor: style.headerBgColor,
    headerTextColor: style.headerTextColor,
    bodyTextColor: style.bodyTextColor,
    fontFamily: style.fontFamily,
  };
}

function stylesArrayToFormValues(
  styles: readonly NotebookModuleStyle[],
): StyleEditorFormValues {
  const byType = new Map<ModuleType, NotebookModuleStyle>();
  for (const style of styles) {
    byType.set(style.moduleType, style);
  }
  const result = {} as Record<ModuleType, ModuleStyleFormValues>;
  for (const moduleType of MODULE_STYLE_TAB_ORDER) {
    const style = byType.get(moduleType);
    if (style) {
      result[moduleType] = styleToFormValues(style);
    }
  }
  return { styles: result };
}

function formValuesToUpdateInput(
  values: StyleEditorFormValues,
): UpdateNotebookStyleInput[] {
  return MODULE_STYLE_TAB_ORDER.map((moduleType) => {
    const style = values.styles[moduleType];
    return {
      moduleType,
      ...style,
    };
  });
}

function hasDirtyFields(input: unknown): boolean {
  if (input === true) return true;
  if (!input || typeof input !== 'object') return false;
  if (Array.isArray(input)) return input.some(hasDirtyFields);
  for (const value of Object.values(input as Record<string, unknown>)) {
    if (hasDirtyFields(value)) return true;
  }
  return false;
}

/**
 * The inner editor form. Isolated so it only mounts once styles are
 * available, guaranteeing all `useWatch`/`Controller` calls see defined
 * values from the first render.
 */
export function StyleEditorForm({
  notebookId,
  styles,
  serverKey,
  registerCloseReset,
}: StyleEditorFormProps) {
  const { t } = useTranslation();
  const saveMutation = useSaveNotebookStyles(notebookId);
  const [activeTab, setActiveTab] = useState<ModuleType>(
    MODULE_STYLE_TAB_ORDER[0],
  );

  const form = useForm<StyleEditorFormValues>({
    resolver: zodResolver(styleEditorSchema),
    defaultValues: stylesArrayToFormValues(styles),
    mode: 'onChange',
  });

  // Reset when server data changes (e.g., after a save updates cache).
  useEffect(() => {
    form.reset(stylesArrayToFormValues(styles));
  }, [serverKey, styles, form]);

  // Expose a reset handler to the parent so it can discard unsaved edits
  // when the drawer is closing.
  useEffect(() => {
    registerCloseReset(() => {
      form.reset(stylesArrayToFormValues(styles));
    });
  }, [registerCloseReset, form, styles]);

  const activeStyle = useWatch({
    control: form.control,
    name: `styles.${activeTab}`,
  });

  const isSaving = saveMutation.isPending;
  const { dirtyFields } = useFormState({ control: form.control });
  // Use dirtyFields to derive dirty state. form.formState.isDirty can be
  // unreliable with deeply nested object forms, so we check whether any
  // field is tracked as dirty instead.
  const isDirty = hasDirtyFields(dirtyFields);

  const onSubmit = form.handleSubmit((values) => {
    saveMutation.mutate(formValuesToUpdateInput(values), {
      onSuccess: () => {
        // Reset is driven by serverKey change once the cache updates, so no
        // explicit reset is required here. However, if the cache writer
        // didn't run (e.g., mocked tests), clear local dirty state.
        form.reset(values);
      },
    });
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-1 flex-col overflow-hidden"
      >
        {isDirty && !isSaving && (
          <p
            data-slot="style-editor-dirty"
            aria-live="polite"
            className="border-b px-4 pb-2 text-xs text-muted-foreground"
          >
            {t('styling.drawer.unsaved')}
          </p>
        )}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ModuleType)}
          className="flex flex-1 flex-col gap-3 overflow-hidden p-4"
        >
          <div className="overflow-x-auto">
            <TabsList
              aria-label={t('styling.drawer.moduleTabs')}
              className="inline-flex h-auto w-max gap-1 bg-transparent p-0"
            >
              {MODULE_STYLE_TAB_ORDER.map((moduleType) => (
                <TabsTrigger
                  key={moduleType}
                  value={moduleType}
                  className="h-8 flex-none whitespace-nowrap px-3"
                >
                  {t(`styling.moduleTypes.${moduleTypeKey(moduleType)}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {MODULE_STYLE_TAB_ORDER.map((moduleType) => (
              <TabsContent
                key={moduleType}
                value={moduleType}
                forceMount
                hidden={moduleType !== activeTab}
                className="flex flex-col gap-4 pt-1 data-[state=inactive]:hidden"
              >
                <StyleEditorTab moduleType={moduleType} />
              </TabsContent>
            ))}

            {activeStyle && (
              <div data-slot="style-editor-preview" className="mt-4">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {t('styling.drawer.preview')}
                </p>
                <StylePreview moduleType={activeTab} style={activeStyle} />
              </div>
            )}
          </div>
        </Tabs>

        <div className="flex items-center justify-end gap-2 border-t p-3">
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            data-slot="style-editor-save"
          >
            {isSaving && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {isSaving ? t('styling.drawer.saving') : t('styling.drawer.save')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
