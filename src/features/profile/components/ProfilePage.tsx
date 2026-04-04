import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileInfoSection } from './ProfileInfoSection';
import { PreferencesSection } from './PreferencesSection';

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
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t('settings.title')}
      </h1>

      <ProfileInfoSection user={user} />

      <PreferencesSection user={user} />

      <Card>
        <CardHeader>
          <CardTitle>{t('presets.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* PresetsSection — implemented in Phase 7 */}
          <p className="text-sm text-muted-foreground">{t('presets.empty')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('deletion.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* AccountDeletionSection — implemented in Phase 6 */}
        </CardContent>
      </Card>
    </div>
  );
}
