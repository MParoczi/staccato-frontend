import { useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import i18next from 'i18next'
import { useAuthStore } from '@/stores/authStore'
import {
  getMe,
  updateMe,
  uploadAvatar,
  requestDeletion,
  cancelDeletion,
  getInstruments,
} from '@/features/profile/api/profileApi'
import type { UpdateProfilePayload, InstrumentOption } from '@/features/profile/api/profileApi'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const profileSchema = z.object({
  firstName: z.string().max(100).nullable(),
  lastName: z.string().max(100).nullable(),
  language: z.enum(['en', 'hu']),
  defaultPageSize: z.string().nullable(),
  defaultInstrumentId: z.string().nullable(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function getInitials(
  firstName: string | null,
  lastName: string | null,
  displayName: string,
): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  return displayName[0]?.toUpperCase() ?? '?'
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(i18next.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ProfilePage() {
  const { t } = useTranslation('profile')
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: profile } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    initialData: user ?? undefined,
  })

  const {
    data: instruments,
    isLoading: instrumentsLoading,
    isError: instrumentsError,
  } = useQuery({
    queryKey: ['instruments'],
    queryFn: getInstruments,
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          language: profile.language as 'en' | 'hu',
          defaultPageSize: profile.defaultPageSize,
          defaultInstrumentId: profile.defaultInstrumentId,
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMe(payload),
    onSuccess: (updated) => {
      updateUser(updated)
      void i18next.changeLanguage(updated.language)
      toast.success(t('saveSuccess'))
    },
    onError: () => toast.error(t('saveError')),
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (result) => {
      if (profile) updateUser({ ...profile, avatarUrl: result.avatarUrl })
      toast.success(t('avatarSuccess'))
    },
    onError: () => toast.error(t('avatarError')),
  })

  const deletionMutation = useMutation({
    mutationFn: requestDeletion,
    onSuccess: (updated) => {
      updateUser(updated)
      setDeleteDialogOpen(false)
    },
    onError: () => toast.error(t('deleteAccount.error')),
  })

  const cancelDeletionMutation = useMutation({
    mutationFn: cancelDeletion,
    onSuccess: (updated) => {
      updateUser(updated)
      toast.success(t('deleteAccount.cancelSuccess'))
    },
    onError: () => toast.error(t('deleteAccount.cancelError')),
  })

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError(t('avatarTooLarge'))
      e.target.value = ''
      return
    }
    setAvatarError(null)
    avatarMutation.mutate(file)
    e.target.value = ''
  }

  function onSubmit(values: ProfileFormValues) {
    const payload: UpdateProfilePayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      language: values.language,
      defaultPageSize: values.defaultPageSize,
    }
    if (!instrumentsError) {
      payload.defaultInstrumentId = values.defaultInstrumentId
    }
    updateMutation.mutate(payload)
  }

  const scheduledDeletionAt = profile?.scheduledDeletionAt
  const initials = profile
    ? getInitials(profile.firstName, profile.lastName, profile.displayName)
    : '?'

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>

      {scheduledDeletionAt && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <span className="text-destructive">
            {t('deleteAccount.warning', { date: formatDate(scheduledDeletionAt) })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-4 shrink-0 text-destructive hover:text-destructive"
            onClick={() => cancelDeletionMutation.mutate()}
            disabled={cancelDeletionMutation.isPending}
          >
            {cancelDeletionMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t('deleteAccount.cancelButton')
            )}
          </Button>
        </div>
      )}

      <div className="mb-8 flex flex-col items-center">
        <button
          type="button"
          onClick={handleAvatarClick}
          className="relative cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('changePhoto')}
        >
          <Avatar className="size-24 text-xl">
            {profile?.avatarUrl && (
              <AvatarImage src={profile.avatarUrl} alt={initials} />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {avatarMutation.isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}
        </button>
        <span className="mt-2 text-sm text-muted-foreground">{t('changePhoto')}</span>
        {avatarError && <p className="mt-1 text-sm text-destructive">{avatarError}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">{t('personalInfo')}</p>

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('firstNameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('firstNamePlaceholder')}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('lastNameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('lastNamePlaceholder')}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>{t('emailLabel')}</Label>
              <Input value={profile?.email ?? ''} disabled readOnly />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">{t('preferences')}</p>

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('languageLabel')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">{t('languageEn')}</SelectItem>
                      <SelectItem value="hu">{t('languageHu')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultPageSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pageSizeLabel')}</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                    value={field.value ?? '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">{t('pageSizeNone')}</SelectItem>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A5">A5</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultInstrumentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('instrumentLabel')}</FormLabel>
                  {instrumentsLoading ? (
                    <Skeleton className="h-9 w-full rounded-md" />
                  ) : instrumentsError ? (
                    <Input disabled value={t('instrumentError')} />
                  ) : (
                    <Select
                      onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">{t('instrumentNone')}</SelectItem>
                        {(instruments as InstrumentOption[]).map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto"
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {t('saveButton')}
          </Button>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-semibold text-destructive">
              {t('deleteAccount.sectionTitle')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('deleteAccount.sectionDescription')}
            </p>
            <Button
              type="button"
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={!!scheduledDeletionAt}
            >
              {t('deleteAccount.button')}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteAccount.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteAccount.dialogDescription', {
                date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
                  i18next.language,
                  { year: 'numeric', month: 'long', day: 'numeric' },
                ),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletionMutation.isPending}
            >
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletionMutation.mutate()}
              disabled={deletionMutation.isPending}
            >
              {deletionMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {t('deleteAccount.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
