import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Pencil, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotebook } from '../hooks/useNotebook';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { EditNotebookDialog } from './EditNotebookDialog';
import { PAGE_SIZE_DIMENSIONS } from '@/lib/constants/grid';

/**
 * Computes relative luminance from a hex color string per WCAG 2.0.
 * Returns a value between 0 (darkest) and 1 (lightest).
 */
function getRelativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastTextColor(hex: string): string {
  return getRelativeLuminance(hex) > 0.179 ? '#1a1a1a' : '#f5f5f0';
}

export function CoverPage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data: notebook } = useNotebook(notebookId!);
  const { data: user } = useCurrentUser();

  if (!notebook) return null;

  const textColor = getContrastTextColor(notebook.coverColor);
  const dimensions = PAGE_SIZE_DIMENSIONS[notebook.pageSize];
  const aspectRatio = `${dimensions.width} / ${dimensions.height}`;
  const ownerName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : '';
  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(notebook.createdAt));

  return (
    <>
      <div
        className="relative mx-auto flex w-full max-w-lg flex-col items-center justify-center rounded-sm shadow-lg"
        style={{
          aspectRatio,
          backgroundColor: notebook.coverColor,
          color: textColor,
        }}
      >
        {/* Edit button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3 hover:bg-white/20"
          style={{ color: textColor }}
          onClick={() => setEditOpen(true)}
          aria-label={t('notebooks.shell.cover.edit')}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>

        {/* Centered content */}
        <div className="flex flex-col items-center gap-4 px-8 text-center">
          {/* Title */}
          <h1
            className="font-serif text-3xl leading-tight font-bold tracking-wide sm:text-4xl"
            style={{ color: textColor }}
          >
            {notebook.title}
          </h1>

          {/* Divider */}
          <div
            className="h-px w-16"
            style={{ backgroundColor: textColor, opacity: 0.4 }}
          />

          {/* Instrument */}
          <p
            className="text-sm uppercase tracking-widest opacity-80"
            aria-label={t('notebooks.shell.cover.instrument')}
          >
            {notebook.instrumentName}
          </p>

          {/* Owner */}
          {ownerName && (
            <p
              className="text-sm opacity-70"
              aria-label={t('notebooks.shell.cover.owner')}
            >
              {ownerName}
            </p>
          )}

          {/* Creation date */}
          <p
            className="text-xs opacity-60"
            aria-label={t('notebooks.shell.cover.createdAt')}
          >
            {formattedDate}
          </p>
        </div>

        {/* Open Notebook button */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <Button
            variant="outline"
            className="gap-2 border-current/30 bg-white/10 backdrop-blur-sm hover:bg-white/20"
            style={{ color: textColor, borderColor: `${textColor}40` }}
            onClick={() => navigate(`/app/notebooks/${notebookId}/index`)}
          >
            <BookOpen className="size-4" aria-hidden="true" />
            {t('notebooks.shell.cover.openNotebook')}
          </Button>
        </div>
      </div>

      <EditNotebookDialog
        notebook={notebook}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

