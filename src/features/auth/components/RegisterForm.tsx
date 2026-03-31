import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from './PasswordInput';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  registerSchema,
  type RegisterFormData,
} from '../schemas/register-schema';
import { useRateLimitError } from '../hooks/useRateLimitError';
import { register as registerUser } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import type { ValidationErrorResponse } from '@/lib/types';

export function RegisterForm() {
  const { t } = useTranslation('translation', { keyPrefix: 'auth.register' });
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { isLimited, secondsRemaining, handleError: handleRateLimit } = useRateLimitError();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      displayName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitting(true);
    try {
      const res = await registerUser({
        email: data.email,
        displayName: data.displayName,
        password: data.password,
      });
      useAuthStore.getState().setAuth(res.accessToken, res.expiresIn);
      await navigate('/app/notebooks', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;

      if (handleRateLimit(axiosErr)) {
        // 429 handled by rate limit hook
      } else if (status === 409) {
        setError('email', { message: t('errors.emailTaken') });
      } else if (status === 400) {
        const body = axiosErr.response?.data as
          | ValidationErrorResponse
          | undefined;
        if (body?.errors) {
          for (const [field, messages] of Object.entries(body.errors)) {
            if (
              field === 'email' ||
              field === 'displayName' ||
              field === 'password'
            ) {
              setError(field, { message: messages[0] });
            }
          }
        } else {
          setError('root', { message: t('errors.genericError') });
        }
      } else if (status && status >= 500) {
        setError('root', { message: t('errors.genericError') });
      } else {
        setError('root', { message: t('errors.networkError') });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <div className="grid gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {isLimited && (
        <p aria-live="polite" className="text-sm text-destructive">
          {t('errors.rateLimited', { seconds: secondsRemaining })}
        </p>
      )}

      {errors.root && !isLimited && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      {/* Email */}
      <div className="grid gap-1.5">
        <Label htmlFor="reg-email">{t('email')}</Label>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'reg-email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="reg-email-error" className="text-sm text-destructive">
            {t(errors.email.message!)}
          </p>
        )}
      </div>

      {/* Display name */}
      <div className="grid gap-1.5">
        <Label htmlFor="reg-displayName">{t('displayName')}</Label>
        <Input
          id="reg-displayName"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.displayName}
          aria-describedby={
            errors.displayName ? 'reg-displayName-error' : undefined
          }
          {...register('displayName')}
        />
        {errors.displayName && (
          <p id="reg-displayName-error" className="text-sm text-destructive">
            {t(errors.displayName.message!)}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="grid gap-1.5">
        <Label htmlFor="reg-password">{t('password')}</Label>
        <PasswordInput
          id="reg-password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={
            errors.password ? 'reg-password-error' : undefined
          }
          {...register('password')}
        />
        {errors.password && (
          <p id="reg-password-error" className="text-sm text-destructive">
            {t(errors.password.message!)}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div className="grid gap-1.5">
        <Label htmlFor="reg-confirmPassword">{t('confirmPassword')}</Label>
        <PasswordInput
          id="reg-confirmPassword"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={
            errors.confirmPassword ? 'reg-confirmPassword-error' : undefined
          }
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p
            id="reg-confirmPassword-error"
            className="text-sm text-destructive"
          >
            {t(errors.confirmPassword.message!)}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" size="lg" disabled={submitting || isLimited} className="w-full">
        {submitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {t('submit')}
      </Button>

      <GoogleSignInButton
        variant="register"
        onSuccess={() => {
          void navigate('/app/notebooks', { replace: true });
        }}
      />
    </form>
  );
}
