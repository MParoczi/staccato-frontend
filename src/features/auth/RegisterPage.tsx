import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AuthLayout } from './components/AuthLayout';
import { RegisterForm } from './components/RegisterForm';

export function RegisterPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'auth.register' });

  return (
    <AuthLayout>
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          {t('loginLink')}
        </Link>
      </p>
    </AuthLayout>
  );
}
