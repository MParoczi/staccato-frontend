import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useBlocker } from 'react-router';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { User } from '@/lib/types';
import { profileSchema, type ProfileFormData } from '../schemas/profile-schema';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { AvatarUpload } from './AvatarUpload';

interface ProfileInfoSectionProps {
  user: User;
}

export function ProfileInfoSection({ user }: ProfileInfoSectionProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });

  const mutation = useUpdateProfile(setError);

  useEffect(() => {
    reset({
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }, [user.firstName, user.lastName, reset]);

  const blocker = useBlocker(isDirty);

  const onSubmit = (data: ProfileFormData) => {
    mutation.mutate(data, {
      onSuccess: () => {
        reset(data);
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.info.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            <AvatarUpload
              avatarUrl={user.avatarUrl}
              firstName={user.firstName}
              lastName={user.lastName}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="firstName">{t('profile.info.firstName')}</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={
                    errors.firstName ? 'firstName-error' : undefined
                  }
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p id="firstName-error" className="text-sm text-destructive">
                    {t(errors.firstName.message!)}
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="lastName">{t('profile.info.lastName')}</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={
                    errors.lastName ? 'lastName-error' : undefined
                  }
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p id="lastName-error" className="text-sm text-destructive">
                    {t(errors.lastName.message!)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="email">{t('profile.info.email')}</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                readOnly
                disabled
                className="truncate"
              />
            </div>

            <Button
              type="submit"
              disabled={!isDirty || isSubmitting || mutation.isPending}
            >
              {(isSubmitting || mutation.isPending) && (
                <Loader2
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t('profile.info.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') {
            blocker.reset();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.unsaved.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.unsaved.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              {t('profile.unsaved.stay')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>
              {t('profile.unsaved.leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
