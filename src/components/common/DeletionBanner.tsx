import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';

export function DeletionBanner() {
  const { t, i18n } = useTranslation();
  const { data: user } = useCurrentUser();

  if (!user?.scheduledDeletionAt) {
    return null;
  }

  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(user.scheduledDeletionAt));

  return (
    <div
      role="alert"
      className="flex items-center gap-3 bg-warning px-4 py-2.5 text-sm text-warning-foreground"
    >
      <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">
        {t('profile.deletion.scheduledMessage', { date: formattedDate })}
      </p>
      <Link
        to="/app/profile"
        className="shrink-0 font-medium underline underline-offset-4 hover:opacity-80"
      >
        {t('profile.deletion.manage')}
      </Link>
    </div>
  );
}
