import { Skeleton } from "@/components/ui/skeleton";

export function ProfileCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-9 w-9 rounded-md" />
    </div>
  );
}

export function ProfileListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProfileCardSkeleton key={i} />
      ))}
    </div>
  );
}

