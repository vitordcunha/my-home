import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSelectSkeleton() {
  return (
    <div className="space-y-2">
      <div className="w-full py-3 px-4 rounded-md border-2 border-border flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-full py-3 px-4 rounded-md border-2 border-border flex items-center gap-3"
        >
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

