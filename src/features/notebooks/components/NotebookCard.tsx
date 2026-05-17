import { useTranslation } from 'react-i18next'
import { MoreHorizontal } from 'lucide-react'
import type { Notebook } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NotebookCardProps {
  notebook: Notebook
  onOpen: () => void
  onSettings: () => void
  onDelete: () => void
}

export function NotebookCard({ notebook, onOpen, onSettings, onDelete }: NotebookCardProps) {
  const { t } = useTranslation('notebooks')

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={onOpen}
    >
      <div className="h-24 w-full" style={{ backgroundColor: notebook.coverColor }} />
      <div
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 bg-white/80 hover:bg-white backdrop-blur-sm"
              aria-label="Notebook options"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>{t('actions.open')}</DropdownMenuItem>
            <DropdownMenuItem onClick={onSettings}>{t('actions.settings')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardContent className="p-3">
        <p className="truncate font-medium">{notebook.title}</p>
        <p className="truncate text-sm text-muted-foreground">Guitar</p>
      </CardContent>
    </Card>
  )
}
