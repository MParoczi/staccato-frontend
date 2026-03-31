import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router';
import { Loader2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordInput } from './PasswordInput';
import { GoogleSignInButton } from './GoogleSignInButton';
import { loginSchema, type LoginFormData } from '../schemas/login-schema';
import { useRateLimitError } from '../hooks/useRateLimitError';
import { login } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

export function LoginForm() {
  const { t } = useTranslation('translation', { keyPrefix: 'auth.login' });
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const { isLimited, secondsRemaining, handleError: handleRateLimit } = useRateLimitError();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    setSubmitting(true);
    try {
      const res = await login(data);
      useAuthStore.getState().setAuth(res.accessToken, res.expiresIn);
      const from = (location.state as { from?: Location })?.from;
      await navigate(from ?? '/app/notebooks', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (handleRateLimit(axiosErr)) {
        // 429 handled by rate limit hook
      } else if (axiosErr.response?.status === 401) {
        setError('root', { message: t('errors.invalidCredentials') });
      } else if (
        axiosErr.response &&
        axiosErr.response.status >= 500
      ) {
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
        <h2 className="text-xl font-semibold tracking-tight">
          {t('title')}
        </h2>
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
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {t(errors.email.message!)}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="grid gap-1.5">
        <Label htmlFor="password">{t('password')}</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {t(errors.password.message!)}
          </p>
        )}
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          onCheckedChange={(checked) =>
            setValue('rememberMe', checked === true)
          }
        />
        <Label htmlFor="rememberMe" className="cursor-pointer font-normal">
          {t('rememberMe')}
        </Label>
      </div>

      {/* Submit */}
      <Button type="submit" size="lg" disabled={submitting || isLimited} className="w-full">
        {submitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {t('submit')}
      </Button>

      <GoogleSignInButton
        variant="login"
        onSuccess={() => {
          const from = (location.state as { from?: Location })?.from;
          void navigate(from ?? '/app/notebooks', { replace: true });
        }}
      />
    </form>
  );
}
