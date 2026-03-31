import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import { googleLogin } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

interface GoogleSignInButtonProps {
  variant: 'login' | 'register';
  onSuccess: () => void;
}

export function GoogleSignInButton({
  variant,
  onSuccess,
}: GoogleSignInButtonProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'auth.common' });
  const errorKeyPrefix = variant === 'login' ? 'auth.login' : 'auth.register';
  const { t: tError } = useTranslation('translation', {
    keyPrefix: errorKeyPrefix,
  });
  const [error, setError] = useState<string | null>(null);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">{t('or')}</span>
        </div>
      </div>

      <div className="flex justify-center">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          setError(null);
          const credential = credentialResponse.credential;
          if (!credential) {
            setError(tError('errors.googleFailed'));
            return;
          }
          try {
            const res = await googleLogin(credential);
            useAuthStore.getState().setAuth(res.accessToken, res.expiresIn);
            onSuccess();
          } catch {
            setError(tError('errors.googleFailed'));
          }
        }}
        onError={() => {
          setError(tError('errors.googleFailed'));
        }}
        theme="outline"
        size="large"
        shape="rectangular"
        text={variant === 'login' ? 'signin_with' : 'signup_with'}
        width={320}
      />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
