import { Skeleton } from "@/components/ui/skeleton";

export function ShoppingItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

export function ShoppingListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <ShoppingItemSkeleton key={i} />
      ))}
    </div>
  );
}

