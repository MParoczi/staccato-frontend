import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'auth.login.errors.emailRequired')
    .email('auth.login.errors.emailInvalid'),
  password: z
    .string()
    .min(1, 'auth.login.errors.passwordRequired')
    .min(8, 'auth.login.errors.passwordMin'),
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;
