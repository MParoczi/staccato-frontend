import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageNavigationArrowsProps {
  prevUrl: string | null;
  nextUrl: string | null;
}

export function PageNavigationArrows({ prevUrl, nextUrl }: PageNavigationArrowsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-10 flex items-center justify-between px-4">
      <Button
        variant="ghost"
        size="icon"
        className="pointer-events-auto text-muted-foreground"
        disabled={!prevUrl}
        onClick={() => prevUrl && void navigate(prevUrl)}
        aria-label={t('notebooks.shell.nav.previousPage')}
        style={!prevUrl ? { opacity: 0.3 } : { opacity: 0.6 }}
      >
        <ChevronLeft className="size-6" aria-hidden="true" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="pointer-events-auto text-muted-foreground"
        disabled={!nextUrl}
        onClick={() => nextUrl && void navigate(nextUrl)}
        aria-label={t('notebooks.shell.nav.nextPage')}
        style={!nextUrl ? { opacity: 0.3 } : { opacity: 0.6 }}
      >
        <ChevronRight className="size-6" aria-hidden="true" />
      </Button>
    </div>
  );
}
