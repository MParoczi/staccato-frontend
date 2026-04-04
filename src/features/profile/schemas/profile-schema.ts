import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'profile.info.firstNameRequired')
    .max(100, 'profile.info.firstNameMax'),
  lastName: z
    .string()
    .trim()
    .min(1, 'profile.info.lastNameRequired')
    .max(100, 'profile.info.lastNameMax'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
