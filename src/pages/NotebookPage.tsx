import { NavLink, Outlet, useParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getNotebook } from '@/features/notebooks/api/notebooksApi'
import type { Notebook } from '@/types'

interface NotebookOutletContext {
  notebook: Notebook
}

export default function NotebookPage() {
  const { t } = useTranslation('notebooks')
  const { id } = useParams<{ id: string }>()
  const { data: notebook, isLoading, isError } = useQuery({
    queryKey: ['notebooks', id],
    queryFn: () => getNotebook(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return <Skeleton className="m-4 h-96 w-full rounded-lg" />
  }

  if (isError || !notebook) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="mb-4 text-lg font-semibold">{t('errors.notFound')}</p>
        <Button asChild variant="outline">
          <Link to="/app/notebooks">Go back to notebooks</Link>
        </Button>
      </div>
    )
  }

  const tabs = [
    { path: 'cover', label: t('book.coverTab'), disabled: false },
    { path: 'index', label: t('book.indexTab'), disabled: false },
    { path: 'lessons', label: t('book.lessonsTab'), disabled: false },
  ]

  return (
    <div className="flex flex-col">
      <nav className="flex border-b px-4" aria-label="Notebook tabs">
        {tabs.map((tab) =>
          tab.disabled ? (
            <span
              key={tab.path}
              className="-mb-px border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground cursor-not-allowed select-none"
            >
              {tab.label}
            </span>
          ) : (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {tab.label}
            </NavLink>
          )
        )}
      </nav>
      <Outlet context={{ notebook } satisfies NotebookOutletContext} />
    </div>
  )
}
