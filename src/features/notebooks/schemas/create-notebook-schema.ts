import { z } from 'zod';

export const createNotebookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'notebooks.create.titleRequired')
    .max(200, 'notebooks.create.titleMaxLength')
    .refine((val) => val.trim().length > 0, {
      message: 'notebooks.create.titleRequired',
    }),
  instrumentId: z.string().min(1, 'notebooks.create.instrumentRequired'),
  pageSize: z.enum(['A4', 'A5', 'A6', 'B5', 'B6'], {
    error: 'notebooks.create.pageSizeRequired',
  }),
  coverColor: z
    .string()
    .min(1, 'notebooks.create.invalidHex')
    .regex(/^#?[0-9a-fA-F]{6}$/, 'notebooks.create.invalidHex')
    .transform((val) => (val.startsWith('#') ? val : `#${val}`)),
});

export type CreateNotebookFormData = z.infer<typeof createNotebookSchema>;
