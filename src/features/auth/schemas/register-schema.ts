import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'auth.register.errors.emailRequired')
      .email('auth.register.errors.emailInvalid')
      .max(256, 'auth.register.errors.emailMax'),
    displayName: z
      .string()
      .min(2, 'auth.register.errors.displayNameMin')
      .max(100, 'auth.register.errors.displayNameMax'),
    password: z
      .string()
      .min(1, 'auth.register.errors.passwordRequired')
      .min(8, 'auth.register.errors.passwordMin')
      .regex(/[A-Z]/, 'auth.register.errors.passwordUppercase')
      .regex(/[a-z]/, 'auth.register.errors.passwordLowercase')
      .regex(/\d/, 'auth.register.errors.passwordDigit'),
    confirmPassword: z
      .string()
      .min(1, 'auth.register.errors.confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.register.errors.passwordsMismatch',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
