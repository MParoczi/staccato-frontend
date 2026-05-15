import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url('VITE_API_BASE_URL must be a valid URL'),
  VITE_GOOGLE_CLIENT_ID: z.string().min(1, 'VITE_GOOGLE_CLIENT_ID is required'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors
  console.error('Invalid environment variables:', errors)
  throw new Error(
    `Missing or invalid environment variables:\n${JSON.stringify(errors, null, 2)}`,
  )
}

export const env = parsed.data
