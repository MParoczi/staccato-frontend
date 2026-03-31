import { describe, it, expect } from 'vitest';
import { registerSchema } from './register-schema';

const valid = {
  email: 'user@example.com',
  displayName: 'John Doe',
  password: 'Password1',
  confirmPassword: 'Password1',
};

function parseError(data: Record<string, unknown>, field: string) {
  const result = registerSchema.safeParse(data);
  if (result.success) return null;
  return result.error.issues.find((i) => i.path[0] === field)?.message ?? null;
}

describe('registerSchema', () => {
  it('passes with valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('fails when email is missing', () => {
    expect(parseError({ ...valid, email: '' }, 'email')).toBe(
      'auth.register.errors.emailRequired',
    );
  });

  it('fails when email format is invalid', () => {
    expect(parseError({ ...valid, email: 'bad' }, 'email')).toBe(
      'auth.register.errors.emailInvalid',
    );
  });

  it('fails when email exceeds 256 characters', () => {
    const longEmail = 'a'.repeat(251) + '@b.com';
    expect(parseError({ ...valid, email: longEmail }, 'email')).toBe(
      'auth.register.errors.emailMax',
    );
  });

  it('fails when displayName is under 2 characters', () => {
    expect(parseError({ ...valid, displayName: 'A' }, 'displayName')).toBe(
      'auth.register.errors.displayNameMin',
    );
  });

  it('fails when displayName exceeds 100 characters', () => {
    expect(
      parseError({ ...valid, displayName: 'A'.repeat(101) }, 'displayName'),
    ).toBe('auth.register.errors.displayNameMax');
  });

  it('fails when password is under 8 characters', () => {
    const data = { ...valid, password: 'Ab1', confirmPassword: 'Ab1' };
    expect(parseError(data, 'password')).toBe(
      'auth.register.errors.passwordMin',
    );
  });

  it('fails when password has no uppercase letter', () => {
    const data = {
      ...valid,
      password: 'password1',
      confirmPassword: 'password1',
    };
    expect(parseError(data, 'password')).toBe(
      'auth.register.errors.passwordUppercase',
    );
  });

  it('fails when password has no lowercase letter', () => {
    const data = {
      ...valid,
      password: 'PASSWORD1',
      confirmPassword: 'PASSWORD1',
    };
    expect(parseError(data, 'password')).toBe(
      'auth.register.errors.passwordLowercase',
    );
  });

  it('fails when password has no digit', () => {
    const data = {
      ...valid,
      password: 'Password',
      confirmPassword: 'Password',
    };
    expect(parseError(data, 'password')).toBe(
      'auth.register.errors.passwordDigit',
    );
  });

  it('fails when passwords do not match', () => {
    const data = { ...valid, confirmPassword: 'Different1' };
    expect(parseError(data, 'confirmPassword')).toBe(
      'auth.register.errors.passwordsMismatch',
    );
  });

  it('passes when passwords match', () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
