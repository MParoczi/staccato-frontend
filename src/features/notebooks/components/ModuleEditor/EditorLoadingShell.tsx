import { cn } from '@/lib/utils';

export interface EditorLoadingShellProps {
  className?: string;
  /** Optional explicit min-height to mirror the host module's grid box. */
  minHeight?: number | string;
}

/**
 * Suspense fallback for `React.lazy(() => import('./ModuleEditor'))`
 * (UI-SPEC §4 host integration). Renders a quiet skeleton with the same
 * border-radius and a transparent border so layout doesn't shift when the
 * real editor hydrates.
 */
export function EditorLoadingShell({ className, minHeight }: EditorLoadingShellProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-editor-loading=""
      style={minHeight !== undefined ? { minHeight } : undefined}
      className={cn(
        'h-full w-full rounded-md border border-transparent bg-muted/20 motion-safe:animate-pulse',
        className,
      )}
    />
  );
}

