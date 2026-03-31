import { describe, it, expect } from 'vitest';
import { loginSchema } from './login-schema';

describe('loginSchema', () => {
  it('passes with valid input', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'Password1',
      rememberMe: true,
    });
    expect(result.success).toBe(true);
  });

  it('fails when email is missing', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.issues.filter(
        (i) => i.path[0] === 'email',
      );
      expect(emailErrors[0].message).toBe('errors.emailRequired');
    }
  });

  it('fails when email format is invalid', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.issues.filter(
        (i) => i.path[0] === 'email',
      );
      expect(emailErrors[0].message).toBe('errors.emailInvalid');
    }
  });

  it('shows "required" error for empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwErrors = result.error.issues.filter(
        (i) => i.path[0] === 'password',
      );
      expect(pwErrors[0].message).toBe('errors.passwordRequired');
    }
  });

  it('shows "min 8" error for short password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwErrors = result.error.issues.filter(
        (i) => i.path[0] === 'password',
      );
      expect(pwErrors[0].message).toBe('errors.passwordMin');
    }
  });

  it('defaults rememberMe to false when omitted', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'Password1',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(false);
    }
  });

  it('accepts rememberMe as true', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'Password1',
      rememberMe: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(true);
    }
  });

  it('accepts rememberMe as false', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'Password1',
      rememberMe: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(false);
    }
  });
});
