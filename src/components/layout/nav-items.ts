import { BookOpen, Music, Download, type LucideIcon } from 'lucide-react';

export interface NavItem {
  /** i18n key (under app.sidebar.nav.*) for the label */
  labelKey: 'notebooks' | 'chords' | 'exports';
  /** Lucide icon component */
  icon: LucideIcon;
  /** Destination path (prefix-matched by NavLink) */
  path: '/app/notebooks' | '/app/chords' | '/app/exports';
}

export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'notebooks', icon: BookOpen, path: '/app/notebooks' },
  { labelKey: 'chords', icon: Music, path: '/app/chords' },
  { labelKey: 'exports', icon: Download, path: '/app/exports' },
] as const;
