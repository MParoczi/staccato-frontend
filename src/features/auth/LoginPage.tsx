import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AuthLayout } from './components/AuthLayout';
import { LoginForm } from './components/LoginForm';

export function LoginPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'auth.login' });

  return (
    <AuthLayout>
      <LoginForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          {t('registerLink')}
        </Link>
      </p>
    </AuthLayout>
  );
}
