import { Outlet } from 'react-router';

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside>{/* Sidebar slot — implemented in a future feature */}</aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
