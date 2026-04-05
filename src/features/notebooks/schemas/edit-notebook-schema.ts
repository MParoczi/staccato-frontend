import { z } from 'zod';

export const editNotebookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'notebooks.shell.edit.titleRequired')
    .max(200, 'notebooks.shell.edit.titleMaxLength')
    .refine((val) => val.trim().length > 0, {
      message: 'notebooks.shell.edit.titleRequired',
    }),
  coverColor: z
    .string()
    .min(1, 'notebooks.shell.edit.invalidHex')
    .regex(/^#[0-9a-fA-F]{6}$/, 'notebooks.shell.edit.invalidHex'),
});

export type EditNotebookFormData = z.infer<typeof editNotebookSchema>;
