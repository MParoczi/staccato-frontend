import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronsUpDown, LogOut, User, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import type { UserDisplayProjection } from '@/lib/utils/user-display';

export interface UserMenuProps {
  projection: UserDisplayProjection;
  avatarUrl: string | null;
  onLogout: () => void;
}

export function UserMenu({ projection, avatarUrl, onLogout }: UserMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isLoggingOut = useAuthStore((s) => s.isLoggingOut);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('app.sidebar.userMenu.openLabel')}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none"
        >
          <Avatar className="size-8 shrink-0">
            {avatarUrl != null && <AvatarImage src={avatarUrl} alt={projection.displayName} />}
            <AvatarFallback>
              {projection.avatarFallback === 'icon' ? (
                <UserCircle className="size-4" aria-hidden="true" />
              ) : (
                projection.avatarFallback
              )}
            </AvatarFallback>
          </Avatar>
          <span className="truncate" title={projection.displayName}>
            {projection.displayName}
          </span>
          <ChevronsUpDown className="ml-auto size-4 shrink-0" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start">
        <DropdownMenuItem
          onSelect={() => {
            void navigate('/app/profile');
          }}
        >
          <User className="size-4" aria-hidden="true" />
          {t('app.sidebar.userMenu.profile')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={onLogout}
        >
          <LogOut className="size-4" aria-hidden="true" />
          {t('app.sidebar.userMenu.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
