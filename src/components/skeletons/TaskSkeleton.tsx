import { Skeleton } from "@/components/ui/skeleton";

export function TaskSkeleton() {
  return (
    <div className="bg-card rounded-lg p-4 border border-border">
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
  );
}

export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  );
}

