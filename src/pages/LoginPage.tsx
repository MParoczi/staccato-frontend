import { useMemo } from 'react'
import { Navigate, Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { GoogleLogin } from '@react-oauth/google'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { login, loginWithGoogle } from '@/features/auth/api/authApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)
  const setAuth = useAuthStore((s) => s.setAuth)

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t('validation.emailRequired'))
          .email(t('validation.emailInvalid')),
        password: z.string().min(1, t('validation.passwordRequired')),
        rememberMe: z.boolean().default(false),
      }),
    [t]
  )

  type LoginFormValues = z.infer<typeof loginSchema>

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  if (status === 'authenticated') return <Navigate to="/app/notebooks" replace />

  async function onSubmit(values: LoginFormValues) {
    try {
      const { user, accessToken } = await login(values.email, values.password, values.rememberMe)
      setAuth(user, accessToken)
      navigate('/app/notebooks', { replace: true })
    } catch {
      toast.error(t('errors.invalidCredentials'))
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
            <CardTitle className="text-center">{t('login.title')}</CardTitle>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.emailLabel')}</FormLabel>
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
                      <FormLabel>{t('login.passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="rememberMe"
                        />
                      </FormControl>
                      <Label htmlFor="rememberMe" className="cursor-pointer font-normal">
                        {t('login.rememberMe')}
                      </Label>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {t('login.submitButton')}
                </Button>
              </form>
            </Form>

            <p className="text-sm text-center text-muted-foreground">
              <Link to="/register" className="underline underline-offset-4 hover:text-foreground">
                {t('login.registerLink')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
