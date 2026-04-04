import { useTranslation } from 'react-i18next';
import { Palette } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPresets } from '../hooks/useUserPresets';

function PresetsSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-b py-3 last:border-b-0">
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function PresetsSection() {
  const { t } = useTranslation();
  const { data: presets, isLoading } = useUserPresets();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.presets.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <PresetsSkeleton />
        ) : !presets || presets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
            <Palette className="size-8 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-sm">{t('profile.presets.empty')}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="border-b py-3 text-sm last:border-b-0"
              >
                {preset.name}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <button
          type="button"
          disabled
          className="text-sm text-muted-foreground/50 cursor-not-allowed"
        >
          {t('profile.presets.manageLink')}
        </button>
      </CardFooter>
    </Card>
  );
}
