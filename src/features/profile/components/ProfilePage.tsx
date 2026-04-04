import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageErrorBoundary } from '@/components/common/PageErrorBoundary';
import { ProfileInfoSection } from './ProfileInfoSection';
import { PreferencesSection } from './PreferencesSection';
import { AccountDeletionSection } from './AccountDeletionSection';
import { PresetsSection } from './PresetsSection';

function ProfilePageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation('translation', { keyPrefix: 'profile' });
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading || !user) {
    return <ProfilePageSkeleton />;
  }

  return (
    <PageErrorBoundary>
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('settings.title')}
        </h1>

        <ProfileInfoSection user={user} />

        <PreferencesSection user={user} />

        <PresetsSection />

        <AccountDeletionSection user={user} />
      </div>
    </PageErrorBoundary>
  );
}
