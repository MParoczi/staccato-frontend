import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Music2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen">
      {/* Branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center bg-primary/5 px-12">
        <div className="flex items-center gap-3 text-primary">
          <Music className="size-10" aria-hidden="true" />
          <Music2 className="size-8 opacity-60" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
          Staccato
        </h1>
        <p className="mt-3 text-center text-muted-foreground">
          {t('auth.branding.tagline')}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 lg:w-3/5">
        {/* Mobile branding — shown below lg */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="flex items-center gap-2 text-primary">
            <Music className="size-7" aria-hidden="true" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            Staccato
          </h1>
        </div>

        <Card className="w-full max-w-md">
          <CardContent className="pt-2">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
