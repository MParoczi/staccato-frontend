import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Music, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NotebookSummary } from '@/lib/types';

interface NotebookCardProps {
  notebook: NotebookSummary;
  onDelete: (notebook: NotebookSummary) => void;
}

export function NotebookCard({ notebook, onDelete }: NotebookCardProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedDate = dateFormatter.format(new Date(notebook.updatedAt));

  const lessonLabel = t('notebooks.card.lessons', {
    count: notebook.lessonCount,
  });

  function handleCardClick() {
    navigate(`/app/notebooks/${notebook.id}`);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(notebook);
  }

  return (
    <div
      role="link"
      tabIndex={0}
      className="group/notebook-card cursor-pointer overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none"
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div
        className="h-24 w-full"
        style={{ backgroundColor: notebook.coverColor }}
      />

      <div className="relative flex flex-col gap-2 p-4">
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="relative opacity-0 transition-opacity group-hover/notebook-card:opacity-100 focus:opacity-100 after:absolute after:content-[''] after:-inset-[10px]"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDeleteClick}
              >
                <Trash2 className="size-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="line-clamp-2 pr-8 text-sm font-medium leading-snug">
          {notebook.title}
        </h3>

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
            <Music className="size-3.5 shrink-0" />
            <span className="truncate">{notebook.instrumentName}</span>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {notebook.pageSize}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">{lessonLabel}</p>

        <p className="text-xs text-muted-foreground">
          {t('notebooks.card.updated')} {formattedDate}
        </p>
      </div>
    </div>
  );
}
