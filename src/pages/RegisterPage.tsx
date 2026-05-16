import { useMemo } from 'react'
import { Navigate, Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { GoogleLogin } from '@react-oauth/google'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { register, loginWithGoogle } from '@/features/auth/api/authApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function RegisterPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)
  const setAuth = useAuthStore((s) => s.setAuth)

  const registerSchema = useMemo(
    () =>
      z.object({
        displayName: z
          .string()
          .min(1, t('validation.displayNameRequired'))
          .max(50, t('validation.displayNameMaxLength')),
        email: z
          .string()
          .min(1, t('validation.emailRequired'))
          .email(t('validation.emailInvalid')),
        password: z.string().min(8, t('validation.passwordMinLength')),
      }),
    [t]
  )

  type RegisterFormValues = z.infer<typeof registerSchema>

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: { displayName: '', email: '', password: '' },
  })

  if (status === 'authenticated') return <Navigate to="/app/notebooks" replace />

  async function onSubmit(values: RegisterFormValues) {
    try {
      const { user, accessToken } = await register(values.email, values.displayName, values.password)
      setAuth(user, accessToken)
      navigate('/app/notebooks', { replace: true })
    } catch {
      toast.error(t('errors.emailTaken'))
    }
  }

  async function handleGoogleSuccess(idToken: string) {
    try {
      const { user, accessToken } = await loginWithGoogle(idToken)
      setAuth(user, accessToken)
      navigate('/app/notebooks', { replace: true })
    } catch {
      toast.error(t('errors.googleFailed'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-dots">
      <div className="w-full max-w-md px-4 py-8">
        <p className="text-center text-3xl font-bold tracking-tight mb-6">Staccato</p>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t('register.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    void handleGoogleSuccess(credentialResponse.credential)
                  }
                }}
                onError={() => {
                  toast.error(t('errors.googleFailed'))
                }}
              />
            </div>

            <div className="relative flex items-center">
              <Separator className="flex-1" />
              <span className="mx-3 text-xs text-muted-foreground shrink-0">or</span>
              <Separator className="flex-1" />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.displayNameLabel')}</FormLabel>
                      <FormControl>
                        <Input type="text" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {t('register.submitButton')}
                </Button>
              </form>
            </Form>

            <p className="text-sm text-center text-muted-foreground">
              <Link to="/login" className="underline underline-offset-4 hover:text-foreground">
                {t('register.loginLink')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
