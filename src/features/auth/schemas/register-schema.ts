import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'errors.emailRequired')
      .email('errors.emailInvalid')
      .max(256, 'errors.emailMax'),
    displayName: z
      .string()
      .min(2, 'errors.displayNameMin')
      .max(100, 'errors.displayNameMax'),
    password: z
      .string()
      .min(1, 'errors.passwordRequired')
      .min(8, 'errors.passwordMin')
      .regex(/[A-Z]/, 'errors.passwordUppercase')
      .regex(/[a-z]/, 'errors.passwordLowercase')
      .regex(/\d/, 'errors.passwordDigit'),
    confirmPassword: z
      .string()
      .min(1, 'errors.confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'errors.passwordsMismatch',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
