import { Skeleton } from "@/components/ui/skeleton";

export function WeekViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 text-center space-y-2">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>

      {/* Days navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-border bg-card min-w-[72px]"
          >
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-4" />
          </div>
        ))}
      </div>

      {/* Active day header */}
      <div className="flex items-center justify-between gap-3 px-2">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 text-center space-y-2">
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>

      {/* Refresh button */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Tasks list skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-2 mt-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

