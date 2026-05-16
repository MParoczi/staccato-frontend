import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url('VITE_API_BASE_URL must be a valid URL'),
  VITE_GOOGLE_CLIENT_ID: z.string().min(1, 'VITE_GOOGLE_CLIENT_ID is required'),
})

describe('env validation schema', () => {
  it('passes with valid env vars', () => {
    const result = envSchema.safeParse({
      VITE_API_BASE_URL: 'http://localhost:5000',
      VITE_GOOGLE_CLIENT_ID: 'client-id-123',
    })
    expect(result.success).toBe(true)
  })

  it('fails when VITE_API_BASE_URL is missing', () => {
    const result = envSchema.safeParse({
      VITE_GOOGLE_CLIENT_ID: 'client-id-123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.VITE_API_BASE_URL).toBeDefined()
    }
  })

  it('fails when VITE_API_BASE_URL is not a valid URL', () => {
    const result = envSchema.safeParse({
      VITE_API_BASE_URL: 'not-a-url',
      VITE_GOOGLE_CLIENT_ID: 'client-id-123',
    })
    expect(result.success).toBe(false)
  })

  it('fails when VITE_GOOGLE_CLIENT_ID is empty', () => {
    const result = envSchema.safeParse({
      VITE_API_BASE_URL: 'http://localhost:5000',
      VITE_GOOGLE_CLIENT_ID: '',
    })
    expect(result.success).toBe(false)
  })
})
