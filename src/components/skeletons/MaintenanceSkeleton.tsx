import { Skeleton } from "@/components/ui/skeleton";

export function MaintenanceSkeleton() {
  return (
    <div className="bg-card rounded-lg p-4 border-l-4 border-border">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

export function MaintenanceListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <MaintenanceSkeleton key={i} />
      ))}
    </div>
  );
}

