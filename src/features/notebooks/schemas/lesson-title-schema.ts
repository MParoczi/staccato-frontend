import { z } from 'zod';

export const lessonTitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'notebooks.shell.lessonTitle.required')
    .max(200, 'notebooks.shell.lessonTitle.maxLength')
    .refine((val) => val.trim().length > 0, {
      message: 'notebooks.shell.lessonTitle.required',
    }),
});

export type LessonTitleFormData = z.infer<typeof lessonTitleSchema>;
