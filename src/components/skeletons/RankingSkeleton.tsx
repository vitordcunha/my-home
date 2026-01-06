import { Skeleton } from "@/components/ui/skeleton";

export function RankingItemSkeleton({ isTop3 = false }: { isTop3?: boolean }) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        isTop3 ? "bg-gradient-to-r from-primary/5 to-transparent" : "bg-card"
      }`}
    >
      <Skeleton
        className={`${
          isTop3 ? "h-12 w-12" : "h-10 w-10"
        } rounded-full flex-shrink-0`}
      />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-16 rounded-full" />
    </div>
  );
}

export function RankingListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <RankingItemSkeleton key={i} isTop3={i < 3} />
      ))}
    </div>
  );
}

