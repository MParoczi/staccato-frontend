import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'errors.emailRequired')
    .email('errors.emailInvalid'),
  password: z
    .string()
    .min(1, 'errors.passwordRequired')
    .min(8, 'errors.passwordMin'),
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;
