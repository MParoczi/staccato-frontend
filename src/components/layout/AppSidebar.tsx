import { Link, NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from './nav-items';

export function AppSidebar() {
  const { t } = useTranslation();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground sticky top-0">
      {/* Wordmark */}
      <div className="px-4 py-5">
        <Link
          to="/app/notebooks"
          className="text-xl font-bold tracking-tight text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-sm"
        >
          {t('app.sidebar.brand')}
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label={t('app.sidebar.nav.label')} className="min-h-0 flex-1 overflow-y-auto px-2">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const label = t(`app.sidebar.nav.${item.labelKey}`);
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  title={label}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    ].join(' ')
                  }
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Divider + user section placeholder (US2 fills this) */}
      <div className="border-t border-sidebar-border p-2" />
    </aside>
  );
}
