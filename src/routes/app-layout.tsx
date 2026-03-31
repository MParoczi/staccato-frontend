import { Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProactiveRefresh } from '@/features/auth/hooks/useProactiveRefresh';
import { useAuthStore } from '@/stores/authStore';
import { rawClient } from '@/api/raw-client';

export function AppLayout() {
  useProactiveRefresh();
  const { t } = useTranslation('translation', { keyPrefix: 'auth' });
  const navigate = useNavigate();

  const handleLogout = () => {
    rawClient.delete('/auth/logout');
    useAuthStore.getState().clearAuth();
    void navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-end border-b bg-muted/40 px-4 py-2">
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          {t('signOut')}
        </Button>
      </header>
      <div className="flex flex-1">
        <aside>{/* Sidebar slot — implemented in a future feature */}</aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
