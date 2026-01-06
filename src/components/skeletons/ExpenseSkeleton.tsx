import { Skeleton } from "@/components/ui/skeleton";

export function ExpenseSkeleton() {
  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-6 w-20 ml-auto" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function ExpenseListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ExpenseSkeleton key={i} />
      ))}
    </div>
  );
}

