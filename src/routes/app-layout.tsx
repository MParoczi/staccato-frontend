import { Outlet } from 'react-router';
import { useProactiveRefresh } from '@/features/auth/hooks/useProactiveRefresh';
import { DeletionBanner } from '@/components/common/DeletionBanner';
import { AppSidebar } from '@/components/layout/AppSidebar';

export function AppLayout() {
  useProactiveRefresh();

  return (
    <div className="flex min-h-screen flex-col">
      <DeletionBanner />
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
