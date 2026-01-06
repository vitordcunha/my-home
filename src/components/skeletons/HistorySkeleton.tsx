import { Skeleton } from "@/components/ui/skeleton";

export function HistoryItemSkeleton() {
  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </div>
  );
}

export function HistoryListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <HistoryItemSkeleton key={i} />
      ))}
    </div>
  );
}

