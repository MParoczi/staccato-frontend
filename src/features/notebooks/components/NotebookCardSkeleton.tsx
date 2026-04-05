import { Skeleton } from '@/components/ui/skeleton';

export function NotebookCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Skeleton className="h-24 w-full rounded-none" />

      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />

        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-5 w-8" />
        </div>

        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-32" />
      </div>
    </div>
  );
}
