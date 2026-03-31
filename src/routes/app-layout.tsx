import { Outlet } from 'react-router';
import { useProactiveRefresh } from '@/features/auth/hooks/useProactiveRefresh';

export function AppLayout() {
  useProactiveRefresh();
  return (
    <div className="flex min-h-screen">
      <aside>{/* Sidebar slot — implemented in a future feature */}</aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
