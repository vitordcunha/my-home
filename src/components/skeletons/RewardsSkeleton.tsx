import { Skeleton } from "@/components/ui/skeleton";

export function RewardCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg mt-4" />
      </div>
    </div>
  );
}

export function RewardsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <RewardCardSkeleton key={i} />
      ))}
    </div>
  );
}

