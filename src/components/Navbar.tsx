import { useNavigate, Link, useMatch } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LogOut, User, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/features/auth/api/authApi'
import { getNotebook } from '@/features/notebooks/api/notebooksApi'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function getInitials(firstName: string | null, lastName: string | null, displayName: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }
  return displayName[0]?.toUpperCase() ?? '?'
}

export function Navbar() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  async function handleSignOut() {
    try {
      await logout()
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  const { t: tn } = useTranslation('notebooks')
  const notebookMatch = useMatch('/app/notebooks/:id/*')
  const notebookId = notebookMatch?.params?.id as string | undefined

  const { data: breadcrumbNotebook } = useQuery({
    queryKey: ['notebooks', notebookId],
    queryFn: () => getNotebook(notebookId!),
    enabled: !!notebookId,
    staleTime: 5 * 60 * 1000,
  })

  const initials = user
    ? getInitials(user.firstName, user.lastName, user.displayName)
    : '?'

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background px-4">
      <span className="text-lg font-bold tracking-tight">{t('appName')}</span>
      {notebookId && (
        <>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Link
            to="/app/notebooks"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {tn('book.breadcrumb')}
          </Link>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="max-w-48 truncate text-sm font-medium">
            {breadcrumbNotebook?.title ?? '…'}
          </span>
        </>
      )}
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="User menu"
            >
              <Avatar size="default">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={initials} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/app/profile')}>
              <User className="mr-2 size-4" />
              {t('navbar.myProfile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void handleSignOut()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              {t('navbar.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
