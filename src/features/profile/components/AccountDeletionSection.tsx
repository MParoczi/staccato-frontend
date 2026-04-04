import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { User } from '@/lib/types';
import { useCancelDeletion } from '../hooks/useDeleteAccount';
import { DeleteAccountDialog } from './DeleteAccountDialog';

interface AccountDeletionSectionProps {
  user: User;
}

export function AccountDeletionSection({ user }: AccountDeletionSectionProps) {
  const { t, i18n } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const cancelMutation = useCancelDeletion();

  const isScheduled = user.scheduledDeletionAt !== null;

  const formattedDate = isScheduled
    ? new Intl.DateTimeFormat(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(user.scheduledDeletionAt!))
    : '';

  return (
    <>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>{t('profile.deletion.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isScheduled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('profile.deletion.scheduledMessage', {
                  date: formattedDate,
                })}
              </p>
              <Button
                variant="outline"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending && (
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {t('profile.deletion.cancelButton')}
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setDialogOpen(true)}
            >
              {t('profile.deletion.deleteButton')}
            </Button>
          )}
        </CardContent>
      </Card>

      <DeleteAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
